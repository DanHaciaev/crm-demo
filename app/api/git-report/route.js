import { NextResponse } from "next/server";

export async function GET() {
  const headers = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
  };

  const owner = process.env.GITHUB_OWNER;
  const repo  = process.env.GITHUB_REPO;

  // Получаем список коммитов
  const commitsRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=20`,
    { headers }
  );
  const commits = await commitsRes.json();

  if (!Array.isArray(commits)) {
    return NextResponse.json({ error: "Ошибка получения коммитов" }, { status: 500 });
  }

  // Для каждого коммита получаем детали с файлами
  const detailed = await Promise.all(
    commits.map(async (c) => {
      const detailRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits/${c.sha}`,
        { headers }
      );
      const detail = await detailRes.json();
      return {
        sha:      c.sha.slice(0, 7),
        message:  c.commit.message,
        author:   c.commit.author.name,
        date:     c.commit.author.date,
        stats:    detail.stats,
        files:    (detail.files ?? []).map((f) => ({
          filename:  f.filename,
          status:    f.status,
          additions: f.additions,
          deletions: f.deletions,
          changes:   f.changes,
        })),
      };
    })
  );

  return NextResponse.json(detailed);
}