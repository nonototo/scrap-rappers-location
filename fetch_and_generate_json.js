const fs = require('fs')
const fetch = require('node-fetch')

const JSONDIR = `${__dirname}/html/json/`
const CACHEDIR = `${__dirname}/cache/` 
const BASEURL = 'https://en.wikipedia.org/wiki/'

const initApp = () =>
  new Promise((resolve, reject) => {
    if (!fs.existsSync(CACHEDIR)) {
      fs.mkdirSync(CACHEDIR)
    }
    if (!fs.existsSync(JSONDIR)) {
      fs.mkdirSync(JSONDIR, { recursive: true })
    }    
    resolve()
  })

const readFile = (path, opts = 'utf8') =>
  new Promise((resolve, reject) => {
    fs.readFile(path, opts, (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })

const writeFile = (path, data, opts = 'utf8') =>
  new Promise((resolve, reject) => {
    fs.writeFile(path, data, opts, (err) => {
      if (err) reject(err)
      else resolve(data)
    })
  })

const getOrFetchUrl = (wikiPath) => 
  new Promise((resolve, reject) => {
    const fileName = `${CACHEDIR}${wikiPath}`
    const wikiUrl = `${BASEURL}${wikiPath}`

    if (fs.existsSync(fileName)) {
      readFile(fileName)
        .then(fileContent => resolve(fileContent))
        .catch(err => reject('fs error: ' + err))
    } else {
      fetch(wikiUrl)
        .then(res => res.text())
        .then(html => writeFile(fileName, html))
        .then(html => resolve(html))
        .catch(err => reject('fetch error: ' + err))
    }
  })

const getWikiLinks = (html) => {
  const linksExpression = /<li><a href="\/wiki\/(.*?)".*?>(.*?)<\/a><\/li>/g
  const links = []
  let result
  while (result = linksExpression.exec(html)) {
    links.push({
      href: result[1],
      text: result[2]
    })
  }
  return links
}

const getRapperLocations = (html) => {
  const originExpression = /<tr><th scope="row">(Born|Origin)<\/th><td>(.*?)<\/td>/g
  const match = originExpression.exec(html)
  const links = []
  if (match && match[2]) {
    const originHtml = match[2]
    const locationExpression = /<a href="\/wiki\/(.*?)".*?>(.*?)<\/a>/g
    let result
    while (result = locationExpression.exec(originHtml)) {
      links.push({
        href: result[1],
        text: result[2]
      })
    }
  }
  return links
}

const getLatLon = (html) => {
  const locationExpression = /<span class="geo">\s*([0-9\.\-]+)\s*;\s*([0-9\.\-]+)\s*<\/span>/g
  const match = locationExpression.exec(html)
  if (match && match[2]) {
    return { 
      lat: match[1],
      lng: match[2]
    }
  }
  return null
}

const main = async () => {
  const rappersInfo = []
  const allRappersHtml = await getOrFetchUrl('List_of_hip_hop_musicians')
  const rappersList = await getWikiLinks(allRappersHtml)
  for (let rapper of rappersList) {
    const rapperHtml = await getOrFetchUrl(rapper.href)
    const rapperLocations = getRapperLocations(rapperHtml)
    if (rapperLocations.length > 0) {
      const rapperLocation = rapperLocations[0]
      const locationHtml = await getOrFetchUrl(rapperLocation.href)
      const location = getLatLon(locationHtml)
      if (location) {
        rappersInfo.push({
          name: rapper.text,
          url: rapper.href,
          locationName: rapperLocation.text,
          lat: location.lat,
          lng: location.lng
        })
      }
    }
  }
  const jsonFile = `${JSONDIR}rappers.json`
  await writeFile(jsonFile, JSON.stringify(rappersInfo, null, '  '))
}

console.log("Geneating. Please wait ...")
main()
console.log("Done!")