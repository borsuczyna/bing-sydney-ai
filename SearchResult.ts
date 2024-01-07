interface SearchResult {
    index: number | null;
    title: string;
    snippets: string[];
    data: {
        Date: string;
    } | null;
    context: string | null;
    url: string;
    lastUpdatedDate: string | null;
}

export default SearchResult;