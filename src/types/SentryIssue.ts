interface Annotation {
  url: string
  displayName: string
}

export interface SentryIssue {
  id: string
  status: string
  statusDetails: Record<string, unknown>
  substatus: string | null
  annotations: Annotation[]
}
