const Puppeteer = require('puppeteer');
const fs = require('fs');

let Links = [];
// Linki z google które zostały pobrane z danej strony na google i sprawdzone czy nie ma powtórek
let LinksToUse = [];
let Emails = [];
let TotalPagesNoEmail = [];

async function setupBrowser(){

        const puppeteer = Puppeteer.launch({args: ['--disable-features=site-per-process'], headless:false, ignoreHTTPSErrors: true, defaultViewport: null})

        async function getGoogleLinks(Keyword){

          var browser = await puppeteer;

          var page = await browser.newPage()

          await page.goto('https://google.com');

          // Wyszukiwanie google
          await Promise.all([
              await page.waitForFunction('document.getElementsByName("q").length>0'),
          ]);

          await page.$eval('input[name=q]', (el, value) => el.value = value, Keyword);
          await page.$eval('input[name=btnK]', elem => elem.click());

          // Czekamy aż załadują się linki (wynik wyszukiwania)
          await page.waitForNavigation();
          await Promise.all([
              await page.waitForFunction('document.getElementsByClassName("g").length>0'),
          ]);

          var GoogleLinks = await page.evaluate(() => {
            var PageLinks = [];
            for(let x=0; x<document.getElementsByClassName("g").length; x++){
                PageLinks.push(document.getElementsByClassName("g")[x].getElementsByTagName("a")[0].href);
            } // Pętla
            return PageLinks
          });



          for(let x=0; x<GoogleLinks.length; x++){
            var NieDodawaj=false;
            for(let z=0; z<Links.length; z++){
              if(GoogleLinks[x]==Links[z]){
                NieDodawaj=true;
              }
            }
            if(NieDodawaj==false){
              Links.push(GoogleLinks[x])
              LinksToUse.push(GoogleLinks[x])
            }
          }


          async function CheckWebsite(url){
            var pageScrap = await browser.newPage()
            await pageScrap.goto(url, {timeout: 3000000, waitUntil: 'networkidle2'});



            var GetEmails = await pageScrap.evaluate(() => {
              function extractEmails (text)
              {
                  return text.match(/(?!\S*\.(?:jpg|png|gif|jpeg|io)(?:[\s\n\r]|$))[A-Z0-9._%+-]+@[A-Z0-9.-]{2,65}\.[A-Z]{2,4}/gi);
              }
              var EmailsToSend = [];
              var EmailsTest = extractEmails(document.body.innerHTML);
              if(EmailsTest!=null){
                var EmailsTestRemove = EmailsTest;
                for (let x=0; x<EmailsTest.length; x++){
                  var NieDodawaj = false;
                  var Jeden = 0;
                  for(let z=0; z<EmailsTestRemove.length; z++){
                    if(EmailsTest[x]==EmailsTestRemove[z]){
                        Jeden+=1;
                        if(Jeden>1){
                          EmailsTestRemove.splice(z,1);
                        }
                    }
                  }
                }
                EmailsToSend=EmailsTestRemove;
              }
              return EmailsToSend;
            });

            // Usuwanie powtórek ze wszystkich mailow
            var LinkBezHttp = url;
            LinkBezHttp = LinkBezHttp.replace("//www.", "//");
            var FirstHook = LinkBezHttp.indexOf("//");
            var SecondHook = LinkBezHttp.indexOf(".");
            var CurrentPage = LinkBezHttp.slice(FirstHook+2, SecondHook);


            let AlmostOneEmail = false;
            for(let x=0; x<GetEmails.length; x++){
              var NieDodawaj = false;
              for(let z=0; z<Emails.length; z++){
                if(GetEmails[x]==Emails[z]){
                  NieDodawaj=true;
                }
              }
              if(NieDodawaj==false){
                Emails.push(GetEmails[x])
                AlmostOneEmail=true;
                for(let y=0; y<TotalPagesNoEmail.length; y++){
                  if(TotalPagesNoEmail[y][0]==CurrentPage){
                    TotalPagesNoEmail[y][1] = 0;
                  }
                }
              }
            }
            if(AlmostOneEmail==false){
              var FoundEmail=false;
              for(let y=0; y<TotalPagesNoEmail.length; y++){
                if(TotalPagesNoEmail[y][0]==CurrentPage){
                  TotalPagesNoEmail[y][1] = TotalPagesNoEmail[y][1]+1;
                  FoundEmail=true;
                }
              }
              if(FoundEmail==false){
                TotalPagesNoEmail.push([CurrentPage, 1])
              }
            }

            console.log("X")
            var GetAllLinks = await pageScrap.evaluate(() => {
              var AllLinks = [];
              if(document.getElementsByTagName("a").length>0){


                for(let x=0; x<document.getElementsByTagName("a").length; x++){
              if(document.getElementsByTagName("a")[x].href.indexOf){
                if(document.getElementsByTagName("a")[x].href.indexOf("http")>-1){
                  AllLinks.push(document.getElementsByTagName("a")[x].href);
                }
              }
            }


              if(AllLinks!=null){
                var AllLinksRemove = AllLinks;
                for (let x=0; x<AllLinks.length; x++){
                  var NieDodawaj = false;
                  var Jeden = 0;
                  for(let z=0; z<AllLinksRemove.length; z++){
                    if(AllLinks[x]==AllLinksRemove[z]){
                        Jeden+=1;
                        if(Jeden>1){
                          AllLinksRemove.splice(z,1);
                        }
                    }
                  }
                }
                 AllLinks = AllLinksRemove;

              }

            }
            return AllLinks;
            });


            for(let x=0; x<GetAllLinks.length; x++){
              var NieDodawaj = false;
              for(let z=0; z<Links.length; z++){
                if(GetAllLinks[x]==Links[z]){
                  NieDodawaj=true;
                }
              }
              if(NieDodawaj==false){
                Links.push(GetAllLinks[x])
              }
            }

            await pageScrap.close();

            async function GetNewPage(){
              if(Links[0]){
                console.log("Sprawdzamy: "+Links[0])
                if(Links[0].indexOf("http")==0){
                if(Links[0].indexOf("facebook") >-1 || Links[0].indexOf("undefined")>-1 || Links[0].indexOf("instagram")>-1 || Links[0].indexOf("twitter")>-1 || Links[0].indexOf("linkedin")>-1 || Links[0].indexOf("github")>-1 || Links[0].indexOf("skype")>-1 || Links[0].indexOf("reddit")>-1 || Links[0].indexOf("stackoverflow")>-1 || Links[0].indexOf("wykop")>-1){
                  Links.shift();
                  GetNewPage();
                }else{
                  console.log(Links)
                  console.log("Emails: "+Emails)
                  console.log(TotalPagesNoEmail)
                  console.log("Aktualny link: "+Links[0])
                  Links[0] = Links[0].replace("//www.", "//");
                  var FirstHook = Links[0].indexOf("//");
                  var SecondHook = Links[0].indexOf(".");
                  var CurrentPage = Links[0].slice(FirstHook+2, SecondHook);
                  var LimitedWebsite=false;
                  for(let y=0; y<TotalPagesNoEmail.length; y++){
                    if(TotalPagesNoEmail[y][0]==CurrentPage){
                      if(TotalPagesNoEmail[y][1]>14){
                        LimitedWebsite=true;
                        Links.shift();
                        GetNewPage();
                      }
                    }
                  }
                  if(LimitedWebsite==false){
                    CheckWebsite(Links[0])
                    Links.shift();
                  }

                }

              }else{
                console.log("Zły link: "+ Links[0])
                Links.shift();
                GetNewPage();
              }
              }
			  fs.writeFile('maile.txt', Emails, function (err) {
			  if (err) return console.log(err);
			  
			   });
            }
            GetNewPage();

          } // Koniec funkcji CheckWebsite



         CheckWebsite(LinksToUse[0]);
         LinksToUse.shift();
        } // usePages

        getGoogleLinks("Salon fryzjerski")
} // Setup browser
setupBrowser();
