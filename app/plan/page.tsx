import { redirect } from 'next/navigation'

export default function PlanPage() {
  redirect('/board?tab=plan')
}
