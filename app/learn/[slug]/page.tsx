import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, BookOpen } from "lucide-react";

interface TopicPageProps {
  params: {
    slug: string;
  };
}

interface TopicFrontmatter {
  title: string;
  slug: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  summary: string;
  cve?: string;
}

// Get all topic slugs
function getTopicSlugs(): string[] {
const contentDirectory = path.join(process.cwd(), "content", "learn");
  try {
    const files = fs.readdirSync(contentDirectory);
    return files
      .filter((file) => file.endsWith(".mdx"))
      .map((file) => file.replace(/\.mdx$/, ""));
  } catch {
    return [];
  }
}

// Get topic data by slug
function getTopicBySlug(slug: string): { frontmatter: TopicFrontmatter; content: string } | null {
  const contentDirectory = path.join(process.cwd(), "content", "learn");
  const filePath = path.join(contentDirectory, `${slug}.mdx`);

  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);
    return {
      frontmatter: data as TopicFrontmatter,
      content,
    };
  } catch {
    return null;
  }
}

// Generate static paths
export async function generateStaticParams() {
  const slugs = getTopicSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default function TopicPage({ params }: TopicPageProps) {
  const topic = getTopicBySlug(params.slug);

  if (!topic) {
    notFound();
  }

  const { frontmatter, content } = topic;

  // Simple Markdown to HTML conversion for the MVP
  // In production, you'd use next-mdx-remote or similar
  const htmlContent = content
    .replace(/^---[\s\S]*?---/, "") // Remove frontmatter
    .replace(/^# (.*$)/gm, "<h1 class=\"text-3xl font-bold text-foreground mb-6\">$1</h1>")
    .replace(/^## (.*$)/gm, "<h2 class=\"text-xl font-semibold text-foreground mt-8 mb-4\">$1</h2>")
    .replace(/^### (.*$)/gm, "<h3 class=\"text-lg font-semibold text-foreground mt-6 mb-3\">$1</h3>")
    .replace(/\*\*(.*?)\*\*/g, "<strong class=\"font-semibold\">$1</strong>")
    .replace(/\*(.*?)\*/g, "<em class=\"italic\">$1</em>")
    .replace(/^- (.*$)/gm, "<li class=\"ml-4 list-disc text-muted-foreground\">$1</li>")
    .replace(/```([^`]+)```/g, "<pre class=\"bg-muted p-4 rounded-lg overflow-x-auto my-4\"><code class=\"text-sm\">$1</code></pre>")
    .replace(/`([^`]+)`/g, "<code class=\"bg-muted px-1.5 py-0.5 rounded text-sm font-mono\">$1</code>")
    .replace(/\n\n/g, "</p><p class=\"text-muted-foreground mb-4\">")
    .replace(/\n/g, " ")
    .replace(/<p class=\"text-muted-foreground mb-4\"><\/p>/g, "");

  const difficultyStyles = {
    Beginner: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    Intermediate: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300",
    Advanced: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <Link
            href="/learn"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Learn
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Topic Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span className="text-sm text-muted-foreground">{frontmatter.category}</span>
            <span className="text-muted-foreground">·</span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${difficultyStyles[frontmatter.difficulty]}`}
            >
              {frontmatter.difficulty}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {frontmatter.title}
          </h1>
          {frontmatter.cve && (
            <p className="text-sm text-muted-foreground mb-2">
              CVE: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{frontmatter.cve}</code>
            </p>
          )}
          <p className="text-lg text-muted-foreground">{frontmatter.summary}</p>
        </div>

        {/* Article Content */}
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <div
            dangerouslySetInnerHTML={{
              __html: `<div class="space-y-4">${htmlContent}</div>`,
            }}
          />
        </article>

        {/* Footer CTA */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Learn more security topics in our{" "}
              <Link href="/learn" className="text-teal-600 dark:text-teal-400 hover:underline">
                learning hub
              </Link>
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 dark:bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors"
            >
              Scan a domain
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
