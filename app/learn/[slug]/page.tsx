export default function TopicPage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <h1 className="text-2xl font-bold text-learn">{params.slug}</h1>
    </main>
  );
}
