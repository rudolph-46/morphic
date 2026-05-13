export default function WelcomeLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full overflow-y-auto bg-background">
      {children}
    </div>
  )
}
