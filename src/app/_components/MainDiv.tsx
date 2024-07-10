export const MainDiv: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <main className="w-screen min-h-screen flex flex-nowrap justify-center bg-white mt-12">
      <div className="w-full max-w-5xl">
        {children}
      </div>
    </main>
  );
}
