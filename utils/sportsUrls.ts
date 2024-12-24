export function getSportsUrls(cardSet: string): string[] {
  const cursor = 0;
  
  switch (cardSet) {
    case '1975 NBA Topps':
      return [
        `https://www.sportscardspro.com/console/basketball-cards-1975-topps?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1975-topps?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 50 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1975-topps?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 100 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1975-topps?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 150 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1975-topps?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 200 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1975-topps?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 250 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1975-topps?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 300 }&format=json`
      ];
    case '1989 NBA Hoops':
      return [
        `https://www.sportscardspro.com/console/basketball-cards-1989-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1989-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 50 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1989-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 100 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1989-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 150 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1989-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 200 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1989-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 250 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1989-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 300 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1989-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 350 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1989-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 400 }&format=json`
      ];
    case '1990 NBA Hoops':
      return [
        `https://www.sportscardspro.com/console/basketball-cards-1990-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 50 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 100 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 150 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 200 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 250 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 300 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 350 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 400 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 450 }&format=json`
      ];
    case '1990 NBA Skybox':
      return [
        `https://www.sportscardspro.com/console/basketball-cards-1990-skybox?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-skybox?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 50 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-skybox?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 100 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-skybox?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 150 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-skybox?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 200 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-skybox?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 250 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-skybox?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 300 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-skybox?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 350 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-skybox?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 400 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-skybox?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 450 }&format=json`
      ];
    case '1990 NBA Fleer':
      return [
        `https://www.sportscardspro.com/console/basketball-cards-1990-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 50 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 100 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 150 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1990-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 200 }&format=json`
      ];
    case '1991 NBA Fleer':
      return [
        `https://www.sportscardspro.com/console/basketball-cards-1991-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 50 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 100 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 150 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 200 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 250 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 300 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 350 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 400 }&format=json`
      ];
    case '1991 NBA Hoops':
      return [
        `https://www.sportscardspro.com/console/basketball-cards-1991-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 50 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 100 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 150 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 200 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 250 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 300 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 350 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 400 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 450 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 500 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 550 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-hoops?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 600 }&format=json`
      ];
    case '1991 NBA Upper Deck':
      return [
        `https://www.sportscardspro.com/console/basketball-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 50 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 100 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 150 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 200 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 250 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 300 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 350 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 400 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 450 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 500 }&format=json`,
        `https://www.sportscardspro.com/console/basketball-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 550 }&format=json`,
      ];
    case '1991 NFL Fleer':
      return [
        `https://www.sportscardspro.com/console/football-cards-1991-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 50 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 100 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 150 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 200 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 250 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 300 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 350 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-fleer?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 400 }&format=json`,
      ];
    case '1991 NFL Upper Deck':
      return [
        `https://www.sportscardspro.com/console/football-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 50 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 100 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 150 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 200 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 250 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 300 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 350 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 400 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 450 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 500 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 550 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 600 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 650 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-upper-deck?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 700 }&format=json`
      ];
    case '1991 NFL Pro Set':
      return [
        `https://www.sportscardspro.com/console/football-cards-1991-pro-set?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-pro-set?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 50 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-pro-set?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 100 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-pro-set?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 150 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-pro-set?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 200 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-pro-set?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 250 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-pro-set?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 300 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-pro-set?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 350 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-pro-set?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 400 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-pro-set?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 450 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-pro-set?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 500 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-pro-set?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 550 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-pro-set?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 600 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-pro-set?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 650 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-pro-set?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 700 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-pro-set?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 750 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-pro-set?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 800 }&format=json`
      ];
    case '1991 NFL Proline Portraits':
      return [
        `https://www.sportscardspro.com/console/football-cards-1991-proline-portraits?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-proline-portraits?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 50 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-proline-portraits?sort=model-number&exclude-variants=false&rookies-only=false&$cursor${ cursor + 100 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-proline-portraits?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 150 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-proline-portraits?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 200 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-proline-portraits?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 250 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-proline-portraits?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 300 }&format=json`
      ];
    case '1991 NFL Wild Card College Draft Picks':
      return [
        `https://www.sportscardspro.com/console/football-cards-1991-wild-card-college-draft-picks?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-wild-card-college-draft-picks?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 50 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-wild-card-college-draft-picks?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 100 }&format=json`
      ];
    case '1991 NFL Wild Card':
      return [
        `https://www.sportscardspro.com/console/football-cards-1991-wild-card?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-wild-card?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 50 }&format=json`,
        `https://www.sportscardspro.com/console/football-cards-1991-wild-card?sort=model-number&exclude-variants=false&rookies-only=false&cursor=${ cursor + 100 }&format=json`
      ];
    case '1989 MLB Topps':
      return [
        `https://www.sportscardspro.com/console/baseball-cards-1989-topps?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-topps?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 50 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-topps?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 100 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-topps?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 150 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-topps?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 200 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-topps?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 250 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-topps?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 300 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-topps?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 350 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-topps?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 400 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-topps?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 450 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-topps?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 500 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-topps?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 550 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-topps?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 600 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-topps?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 650 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-topps?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 700 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-topps?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 750 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-topps?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 800 }&format=json`

      ];
    case '1989 MLB SCORE':
      return [
        `https://www.sportscardspro.com/console/baseball-cards-1989-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 50 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 100 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 150 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 200 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 250 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 300 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 350 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 400 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 450 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 500 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 550 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 600 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 650 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 700 }&format=json`
      ];
    case '1989 MLB Donruss':
      return [
        `https://www.sportscardspro.com/console/baseball-cards-1989-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 50 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 100 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 150 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 200 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 250 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 300 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 350 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 400 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 450 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 500 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 550 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 600 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 650 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 700 }&format=json`
      ];
    case '1989 MLB Fleer':
      return [
        `https://www.sportscardspro.com/console/baseball-cards-1989-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 50 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 100 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 150 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 200 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 250 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 300 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 350 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 400 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 450 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 500 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 550 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 600 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 650 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1989-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 700 }&format=json`
      ];
    case '1991 MLB Donruss':
      return [
        `https://www.sportscardspro.com/console/baseball-cards-1991-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 50 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 100 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 150 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 200 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 250 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 300 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 350 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 400 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 450 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 500 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 550 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 600 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 650 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 700 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 750 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 800 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 850 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-donruss?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 900 }&format=json`,
      ];
    case '1991 MLB SCORE':
      return [
        `https://www.sportscardspro.com/console/baseball-cards-1991-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 50 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 100 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 150 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 200 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 250 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 300 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 350 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 400 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 450 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 500 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 550 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 600 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 650 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 700 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 750 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 800 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-score?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 850 }&format=json`,
      ];
    case '1991 MLB Fleer':
      return [
        `https://www.sportscardspro.com/console/baseball-cards-1991-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 50 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 100 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 150 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 200 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 250 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 300 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 350 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 400 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 450 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 500 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 550 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 600 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 650 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 700 }&format=json`,
        `https://www.sportscardspro.com/console/baseball-cards-1991-fleer?sort=model-number&model-number=&rookies-only=false&exclude-variants=false&cursor=${ cursor + 750 }&format=json`,
      ];
    default:
      console.error('Unknown cardSet:', cardSet);
      return [];
  }
}