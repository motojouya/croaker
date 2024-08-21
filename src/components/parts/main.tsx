export const Main: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <main className="w-screen min-h-screen flex flex-nowrap justify-center bg-white">
      <div className="w-full max-w-5xl mt-12">{children}</div>
    </main>
  );
};
