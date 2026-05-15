import { redirect } from 'next/navigation'

// La page /templates a été fusionnée dans /agents (onglet "Bibliothèque").
// Redirection permanente pour préserver les liens existants.
export default function TemplatesRedirect() {
  redirect('/agents?tab=library')
}
