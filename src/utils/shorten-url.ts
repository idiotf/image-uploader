function urlWithParams(baseUrl: string | URL, params: Record<string, string>) {
  const url = new URL(baseUrl)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return url + ''
}

export default async function getShortenUrl(url: string) {
  url = url.replaceAll('script', 'scrip%74')
  const res = await fetch(urlWithParams('https://me2do.naver.com/common/requestJsonpV2.nhn', {
    svcCode: '0',
    url: urlWithParams('https://link.naver.com/bridge', {
      url,
      dst: urlWithParams('naversearchapp://inappbrowser', {
        url,
        version: '10',
        sourceReferer: 'share',
      }),
    }),
  }))
  if (!res.ok) throw `error code ${res.status}`

  const text = await res.text()
  const body = JSON.parse(text.slice(1, -2))
  if (body.code != '200') throw `${body.code} ${body.message}`

  const shortenUrl: string = body.result.url
  return shortenUrl.replace('https://', '')
}
