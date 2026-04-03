export default function SharePage({
  params,
}: {
  params: { shareId: string };
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <h1 className="text-2xl font-bold text-foreground">Shared scan: {params.shareId}</h1>
    </main>
  );
}
