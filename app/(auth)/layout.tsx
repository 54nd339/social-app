export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div
        className="auth-bg absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(-45deg, hsl(263 70% 50% / 0.15), hsl(200 80% 50% / 0.1), hsl(330 70% 50% / 0.1), hsl(263 70% 50% / 0.15))',
          backgroundSize: '400% 400%',
          animation: 'auth-gradient 15s ease infinite',
        }}
      />

      <div
        className="auth-blob absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{
          background: 'hsl(263 70% 50% / 0.4)',
          animation: 'float-blob 20s ease-in-out infinite',
        }}
      />
      <div
        className="auth-blob absolute -right-24 -bottom-24 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{
          background: 'hsl(200 80% 50% / 0.4)',
          animation: 'float-blob-reverse 25s ease-in-out infinite',
        }}
      />
      <div
        className="auth-blob absolute top-1/4 right-1/4 h-64 w-64 rounded-full opacity-15 blur-3xl"
        style={{
          background: 'hsl(330 70% 50% / 0.3)',
          animation: 'float-blob 18s ease-in-out infinite 5s',
        }}
      />

      <div className="relative z-10 px-4">
        <div className="bg-background/80 rounded-2xl border p-1 shadow-xl backdrop-blur-md">
          {children}
        </div>
      </div>
    </div>
  );
}
