export default function ResultPage({
  params,
}: {
  params: { domain: string };
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">
        Results for {decodeURIComponent(params.domain)}
      </h1>
    </main>
  );
}
