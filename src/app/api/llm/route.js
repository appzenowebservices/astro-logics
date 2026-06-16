export async function POST(req) {
  const body = await req.json();
  const res = await fetch("http://82.112.237.86:3690/completion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return Response.json(data);
}
