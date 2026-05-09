import PlaygroundView from '@/components/playground/PlaygroundView';

export const metadata = {
  title: 'Code Playground | Code Recall',
  description: 'Practice your coding skills in a full-screen interactive environment.',
};

export default function PlaygroundPage() {
  return (
    <main className="h-screen pt-28 pb-6 px-4 md:px-8 flex flex-col">
      <PlaygroundView />
    </main>
  );
}
