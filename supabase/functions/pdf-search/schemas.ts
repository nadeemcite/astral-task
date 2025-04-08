interface RequestBody{
    query: string
}

interface SearchResponse{
    url: string
    content: string
    title: string
}

export type {RequestBody, SearchResponse}