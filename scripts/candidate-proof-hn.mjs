const queries = [
  "nervous",
  "anxious",
  "wish me luck",
  "fingers crossed",
  "launching tomorrow",
  "hope people like it",
  "afraid to launch",
  "first launch"
];

function clean(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[^;]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

for (const query of queries) {
  const params = new URLSearchParams({
    query,
    tags: "story",
    numericFilters: "created_at_i>1735689600",
    hitsPerPage: "100"
  });
  const response = await fetch(`https://hn.algolia.com/api/v1/search_by_date?${params}`);
  const payload = await response.json();
  const hits = payload.hits
    .map((hit) => ({
      query,
      id: hit.objectID,
      author: hit.author,
      time: hit.created_at,
      title: hit.title,
      text: clean(hit.story_text),
      url: `https://news.ycombinator.com/item?id=${hit.objectID}`
    }))
    .filter((hit) => hit.title || hit.text)
    .filter((hit) =>
      `${hit.title} ${hit.text}`.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 15);

  console.log(JSON.stringify({ query, count: hits.length, hits }));
}
