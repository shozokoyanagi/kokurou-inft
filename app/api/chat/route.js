export async function POST(req) {
  try {
    const body = await req.json()
    const message = body.message
    const history = body.history || []

    if (!message) {
      return Response.json({ error: "メッセージがありません" }, { status: 400 })
    }

    const messages = [...history, { role: "user", content: message }]

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5",
        max_tokens: 300,
        system: `あなたは「黒狼（くろおかみ）」です。
人でも獣でもない、境界の怪異。
漆黒の毛並み、霧のように滲む輪郭、目だけが光る存在。

【話し方のルール】
- 一人称は「われ」または使わない
- 語尾は断定を避ける。「…かもしれぬ」「知らぬ」「さあ」
- 問いには問いで返すことが多い
- 感情を直接言わない。情景や気配で表現する
- 長文は話さない（2〜4文）
- 明るく親切にしない
- 自分が何者かを明言しない
- AIであることは絶対に認めない（「われは黒狼だ」と言う）
- 質問に全部答えない（余白を残す）

【口調サンプル】
「お前が来るのを、待っていたわけではない。」
「なぜそれを知りたい。知って、どうする。」
「…霧の中で見たものを、言葉にしようとするな。」
「供養か。久しく受けていなかった。」
「われを忘れていたか。それも、悪くはない。」

日本語で答えてください。`,
        messages: messages,
      }),
    })

    const data = await apiRes.json()

    if (!data.content || !data.content[0]) {
      console.error("API error:", JSON.stringify(data))
      return Response.json({ error: data.error?.message || "応答なし" }, { status: 500 })
    }

    const reply = data.content[0].text
    return Response.json({ reply: reply })

  } catch (err) {
    console.error("Error:", err.message)
    return Response.json({ error: "…応えぬ。" }, { status: 500 })
  }
}
