import { useState, useEffect } from "react";
import { Form, useNavigation } from "react-router";
import type { Route } from "./+types/home";

interface IGitHubRepo {
  id: number | string;
  name: string;
  full_name: string;
  private: boolean;
  fork: boolean;
  html_url: string;
  archived: boolean;
}

interface ActionData {
  repos?: IGitHubRepo[];
  deleteResults?: Array<{ repo: string; success: boolean; error?: string }>;
  error?: string;
}

export async function action({
  request,
}: Route.ActionArgs): Promise<ActionData> {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;
  const token = formData.get("token") as string;

  if (!token) {
    return { error: "GitHub token is required" };
  }

  if (intent === "fetch") {
    try {
      const res = await fetch("https://api.github.com/user/repos", {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github+json",
        },
      });

      if (!res.ok) {
        return { error: "Failed to fetch repositories" };
      }

      const repos = await res.json();
      return {
        repos: repos.map((repo: any) => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          private: repo.private,
          html_url: repo.html_url,
          fork: repo.fork,
          archived: repo.archived,
        })),
      };
    } catch (error) {
      return { error: "Network error while fetching repositories" };
    }
  }

  if (intent === "delete") {
    const selectedRepos = formData.get("selectedRepos") as string;
    const currentRepos = formData.get("currentRepos") as string;

    if (!selectedRepos) {
      return { error: "No repositories selected for deletion" };
    }

    try {
      const repoNames = JSON.parse(selectedRepos);
      const existingRepos = currentRepos ? JSON.parse(currentRepos) : [];

      const deleteResults = await Promise.allSettled(
        repoNames.map(async (repoName: string) => {
          const res = await fetch(`https://api.github.com/repos/${repoName}`, {
            method: "DELETE",
            headers: {
              Authorization: `token ${token}`,
              Accept: "application/vnd.github+json",
            },
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }

          return { repo: repoName, success: true };
        })
      );

      const processedResults = deleteResults.map((result, index) => ({
        repo: repoNames[index],
        success: result.status === "fulfilled",
        error: result.status === "rejected" ? result.reason.message : undefined,
      }));

      const successfullyDeleted = processedResults
        .filter((r) => r.success)
        .map((r) => r.repo);

      const updatedRepos = existingRepos.filter(
        (repo: IGitHubRepo) => !successfullyDeleted.includes(repo.full_name)
      );

      return {
        repos: updatedRepos,
        deleteResults: processedResults,
      };
    } catch (error) {
      return { error: "Failed to delete repositories" };
    }
  }

  return { error: "Invalid action" };
}

export default function Home({
  actionData,
}: Route.ComponentProps<typeof action>) {
  const [selected, setSelected] = useState<(string | number)[]>([]);
  const [token, setToken] = useState("");
  const navigation = useNavigation();

  const repos = actionData?.repos || [];
  const isSubmitting = navigation.state === "submitting";
  const submitIntent = navigation.formData?.get("intent");

  useEffect(() => {
    if (actionData?.deleteResults) {
      const successfullyDeleted = actionData.deleteResults
        .filter((r) => r.success)
        .map((r) => r.repo);

      if (successfullyDeleted.length > 0) {
        setSelected((prev) =>
          prev.filter((id) => {
            const repo = repos.find((r) => r.id === id);
            return repo && !successfullyDeleted.includes(repo.full_name);
          })
        );
      }
    }
  }, [actionData?.deleteResults, repos]);

  const toggleRepo = (repoId: string | number) => {
    setSelected((prev) =>
      prev.includes(repoId)
        ? prev.filter((id) => id !== repoId)
        : [...prev, repoId]
    );
  };

  const selectedRepoNames = repos
    .filter((repo) => selected.includes(repo.id))
    .map((repo) => repo.full_name);

  return (
    <div className="min-h-screen bg-slate-50 text-black font-sans flex flex-col items-center">
      <header className=" px-6 py-6 flex justify-center bg-slate-50">
        <div className="flex items-center gap-3 w-full max-w-2xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            fill="currentColor"
            className="self-center text-black"
            viewBox="0 0 16 16"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
          </svg>
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-0.5">
              GitHub Delete
            </h1>
            <span className="text-sm text-gray-500">
              Yoink them repos to the bin.
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-8">
        <Form
          method="post"
          className="flex flex-col sm:flex-row gap-3 items-start mb-8"
        >
          <input type="hidden" name="intent" value="fetch" />
          <div className="flex flex-col flex-1 min-w-0">
            <input
              type="password"
              name="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="GitHub Personal Access Token"
              className="w-full bg-slate-50 border border-black rounded-none px-4 py-2 text-black placeholder-gray-500 focus:ring-2 focus:ring-black outline-none transition"
              required
            />
            <span className="text-xs text-gray-500 mt-1">
              For security reasons, delete the token after use.
            </span>
          </div>
          <button
            type="submit"
            disabled={isSubmitting && submitIntent === "fetch"}
            className="sm:w-36 w-full px-6 py-2 border border-black rounded-none bg-black text-white font-semibold hover:bg-slate-50 hover:text-black transition disabled:opacity-50"
            style={{ minHeight: "44px" }}
          >
            {isSubmitting && submitIntent === "fetch" ? "Loading..." : "Fetch"}
          </button>
        </Form>

        {actionData?.error && (
          <div className="mb-6 p-4 border border-black rounded-none bg-gray-100 text-black text-center font-medium">
            {actionData.error}
          </div>
        )}

        {actionData?.deleteResults && (
          <div className="mb-6 p-4 bg-slate-50 rounded-none border border-black">
            <h3 className="font-semibold mb-2">Deletion Results</h3>
            <ul className="space-y-1">
              {actionData.deleteResults.map((result, index) => (
                <li
                  key={index}
                  className={`flex items-center gap-2 text-sm ${
                    result.success ? "text-black" : "text-red-600"
                  }`}
                >
                  <span>{result.success ? "✓" : "✗"}</span>
                  <span className="font-mono">{result.repo}</span>
                  {result.error && (
                    <span className="text-gray-500">- {result.error}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {repos.length > 0 && (
          <section className="flex flex-col sm:flex-row justify-between items-center mb-6 p-4 bg-slate-50 rounded-none border border-black gap-2">
            <div className="text-sm">
              <span className="font-medium">{selected.length}</span> of{" "}
              <span className="font-medium">{repos.length}</span> selected
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelected(repos.map((r) => r.id))}
                className="text-sm text-black underline"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => setSelected([])}
                className="text-sm text-black underline"
              >
                Clear
              </button>
              {selected.length > 0 && (
                <Form method="post" className="inline">
                  <input type="hidden" name="intent" value="delete" />
                  <input type="hidden" name="token" value={token} />
                  <input
                    type="hidden"
                    name="currentRepos"
                    value={JSON.stringify(repos)}
                  />
                  <input
                    type="hidden"
                    name="selectedRepos"
                    value={JSON.stringify(selectedRepoNames)}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={(e) => {
                      if (
                        !confirm(
                          `Delete ${selected.length} repositories? This cannot be undone.`
                        )
                      ) {
                        e.preventDefault();
                      }
                    }}
                    className="px-4 py-2 border border-black rounded-none bg-black text-white text-sm font-semibold hover:bg-slate-50 hover:text-black transition disabled:opacity-50"
                  >
                    {isSubmitting && submitIntent === "delete"
                      ? "Deleting..."
                      : `Delete ${selected.length}`}
                  </button>
                </Form>
              )}
            </div>
          </section>
        )}

        {repos.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {repos.map((repo) => {
              const isChecked = selected.includes(repo.id);
              return (
                <li
                  key={repo.id}
                  className={`
                  px-5 py-4 border cursor-pointer bg-slate-50 rounded-none transition-all
                  ${
                    isChecked
                      ? "border-black bg-gray-100"
                      : "border-black hover:bg-gray-100"
                  }
                  ${repo.archived ? "opacity-60" : ""}
                `}
                  onClick={() => toggleRepo(repo.id)}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleRepo(repo.id)}
                      className="mt-0.5 accent-black w-4 h-4"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-black underline truncate"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {repo.name}
                        </a>
                      </div>
                      <div className="text-xs text-gray-500 truncate mb-2">
                        {repo.full_name}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {repo.private && (
                          <span className="border border-black text-xs px-2 py-0.5">
                            Private
                          </span>
                        )}
                        {repo.archived && (
                          <span className="border border-black text-xs px-2 py-0.5">
                            Archived
                          </span>
                        )}
                        {repo.fork && (
                          <span className="border border-black text-xs px-2 py-0.5">
                            Fork
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {repos.length === 0 && actionData?.repos && (
          <div className="text-center text-gray-400 py-20">
            <p>No repositories found.</p>
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-gray-500 py-8 bg-slate-50">
        <a
          href="https://github.com/vo1x/github-delete"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            className="text-black"
            fill="currentColor"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
          </svg>
          <span>Source Code</span>
        </a>
      </footer>
    </div>
  );
}
