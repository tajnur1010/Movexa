// ─────────────────────────────────────────────────────────────
//  MOVEXA · DOWNLOAD SETTINGS  (backend setting)
//  SUDHU EI FILE-TA tumi edit korba. Onno kono file dhorar dorkar nei.
//  (This is the ONLY file you edit to manage download links.)
// ─────────────────────────────────────────────────────────────
//
//  Kivabe kaj kore / how it works:
//    1. Ekta Google Sheet banao. Columns (prothom row-e, hubohu ei nam):
//         type   id   season   episode   url
//    2. Sheet-e:  File → Share → Publish to web → (CSV) → Publish → link copy koro
//    3. Nicher SHEET_CSV_URL = '...' er moddhe oi link ta paste koro
//    4. Save → git push → Vercel ekbar rebuild hobe.
//       ER POR Sheet-e link add/change korle rebuild lagbe NA —
//       kichukkhon (Google-r cache, ~2-5 min) por nijei live hobe.
//
//  Column mane / meaning:
//    type    -> "movie"  othoba  "tv"
//    id      -> TMDB id. (URL-e /movie/969681 hole  id = 969681)
//    season  -> TV hole season number. Movie hole FAKA rakho.
//    episode -> TV hole episode number. Movie hole FAKA rakho.
//    url     -> tomar Google Drive download link (ekta single link)
//
//  Example rows / udahoron:
//    type    id       season   episode   url
//    movie   969681                      https://drive.google.com/....
//    tv      1399     1        1         https://drive.google.com/....
//    tv      1399     1        2         https://drive.google.com/....
//
//  Note: URL faka ('') thakle kono Download button dekhabe na —
//        site ekdom safe thake, kichu bhangbe na.
//
//  !! GURUTTOPURNO: ei file-e SHEET_CSV_URL SUDHU EKBAR thakbe.
//     Notun link boshate hole nicher line-tar bhitorer text ta bodlao —
//     notun kore arekta "export const SHEET_CSV_URL" line add korো NA.
// ─────────────────────────────────────────────────────────────

// 👇 Ekhane tomar Google Sheet-er "Publish to web (CSV)" link ta boshao.
export const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRpO_xIRIG7Zwd0PdZNI1nFyq8lxmXuBKTqjl3px7h2r--gmu-LxksBT7FLSX6KTmOzhgzvl9gdmDds/pub?output=csv'
