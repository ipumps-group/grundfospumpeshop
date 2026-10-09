// Uuendab "Kasutatud vs uus Grundfos pump" juhendi sisu:
// - eemaldatud lõik "Millal kasutatud pump siiski sobib" (kliendi soovil)
// - tootenimed lingitud e-poe lehtedele (ka FAQ vastustes)
// - illustreeriv pilt ALPHA GO maandumislehelt
// - lõpus [shop_button] shortcode ("Vaata e-poodi" nupp)
// FAQ jääb <h3>+<p> kujule, et lehe FAQPage JSON-LD säiliks.
// Kasutus: node scripts/create-kasutatud-vs-uus-page.mjs [--dry-run]
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

const DRY = process.argv.includes('--dry-run')
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const SLUG = 'kasutatud-vs-uus-grundfos-pump'

const contentEt = `
<h2>Kas kasutatud Grundfos pump tasub osta?</h2>
<p>Kuulutuses poolteist korda odavam Grundfos pump näeb esimese pilguga hea diil välja. Enne vastamist tasub aga meeles pidada, et pump ei ole mööbliese. See on töömasin, mille tegelik maksumus ei paista ostuhinnast, vaid elektriarvest, remondikuludest ja sellest, kas pump üldse töötab siis, kui seda kõige rohkem vaja läheb.</p>
<p style="text-align: center"><img src="/images/alpha-go/benefit-replacement.jpg" alt="Vana Grundfos pumba tuvastamine Grundfos GO äpiga enne asendamist uue ALPHA GO vastu" width="1200" height="900" style="max-width: 560px; width: 100%"></p>

<h2>Mida ostja tegelikult ei tea</h2>
<p>Kahe väliselt ühesuguse <a href="/unilift">Unilifti</a> või <a href="/tooted/kuttepumbad">ALPHA</a> vahel võib olla aastate jagu töötunde. Üks on seisnud kuivas tehnoruumis ja käinud paar korda kuus, teine on iga paduvihma ajal tundide viisi keldrivett pumpanud. Laagrid, tihendid ja juhtelektroonika kuluvad vaikselt ega anna endast väliselt märku, ei kuulutuse fotol ega ka kohapeal. Müüja ise ei pruugi teada, mida tema pump on kogenud, ja isegi aus vastus sellele küsimusele ostjat ei päästa.</p>

<h2>Garantii, mida pole</h2>
<p>Uue pumba ostjal on tehase garantii ja meie kui ametliku Grundfos edasimüüja tugi. Kui midagi juhtub, lahendame selle. Kasutatud pumba garantii mahub tavaliselt ühte lausesse kuulutuse allservas: pole. Esimene tõsisem tõrge, olgu see mootori põletamine või juhtplaadi rike, maksab enamasti rohkem kui kogu vahe uue ja kasutatud hinna vahel.</p>

<h2>Kallim osa, mida kuulutus ei ütle: elekter</h2>
<p>Erinevus on suurim küttepumpadel. Vana kolme käiguga tsirkulatsioonipump tarbib tüüpiliselt 60–90 vatti, uus elektrooniline Grundfos <a href="/tooted/kuttepumbad">ALPHA</a> vaid 5–45 vatti. Kuna küttepump käib küttehooajal praktiliselt ööpäev läbi, teeb see aastas välja mitmed kümned eurod ja uus pump maksab end enamasti ühe kuni kolme aastaga elektri kokkuhoidu arvelt tagasi. Kasutatud vana pump seda arvestust kunagi ei paranda, vastupidi, iga kuu edasi lükatud vahetus maksab juba järgmises elektriarves.</p>
<p>Sama loogika kehtib ka teiste pumpade kohta, lihtsalt veidi vaiksemate numbritega. Seepärast tasub võrrelda mitte ostuhinda, vaid eluea hinda, see tähendab ostuhinda koos elektri, remondi ja seisakutega. Selle arvutuse juures võidab uus pump peaaegu alati.</p>

<h2>Mida uut meie valikust vaadata?</h2>
<p>Kõikide kategooriate juures on valikujuhend koos tegelike hindadega, et saaksid rahulikult võrrelda:</p>
<ul>
  <li><a href="/tooted/kuttepumbad">Kütte- ja tsirkulatsioonipumbad</a> — <a href="/tooted/kuttepumbad/alpha1-go">ALPHA1 GO</a> alates 170 eurot ja see asendab enamiku vanu UPS-pumaid sama ühendusmõõduga</li>
  <li><a href="/tooted/veeautomaadid">Veeautomaadid ja hüdrofoorid</a> — <a href="/tooted/veeautomaadid/grundfos-scala1">SCALA1</a>, <a href="/tooted/veeautomaadid/grundfos-scala2">SCALA2</a> ja <a href="/tooted/veeautomaadid/grundfos-jp">JP</a> alates 235 eurot</li>
  <li><a href="/tooted/drenaazipumbad">Drenaažipumbad</a> — <a href="/tooted/drenaazipumbad/unilift-cc">Unilift CC</a> alates 173 eurot</li>
  <li><a href="/tooted/puurkaevupumbad">Puurkaevupumbad</a> — <a href="/tooted/puurkaevupumbad/grundfos-sq">SQ</a> alates 741 eurot, kuivakäimise kaitse on sees</li>
  <li><a href="/tooted/salvkaevupumbad">Salvkaevupumbad</a> — <a href="/tooted/salvkaevupumbad/grundfos-jp">JP</a>, <a href="/tooted/salvkaevupumbad/grundfos-sb">SB</a> ja <a href="/tooted/salvkaevupumbad/grundfos-sba">SBA</a> alates 235 eurot</li>
</ul>
<p>Kui vana pump hakkas tasapisi hullu tegema ja kahtled, kas tasub remontida või vahetada, helista +372 527 4403 või kirjuta meile. Vaatame su konkreetse olukorra koos üle, see nõuanne ei maksa midagi.</p>

<h3>Kas kasutatud Grundfos pump on hea ost?</h3>
<p>Maja põhipumba jaoks enamasti mitte. Teadmata töötunnid, puuduv garantii ja vanema põlvkonna energiatarve teevad eluea kogukulu suuremaks kui uuel pumbal, isegi kui ostuhind tundub soodne. Erand on harva kasutatav abipump, mille ajalugu tead ja usaldad.</p>
<h3>Kui kaua Grundfos pump vastu peab?</h3>
<p>Korrektselt paigaldatult ja hooldatult töötab Grundfos pump tüüpiliselt kümme kuni viisteist aastat, sageli kauemgi. Kasutatud pumba ostja ei tea aga, kui suur osa sellest ajast on juba kulunud, ja just seda peaks hind kajastama, aga kuulutus seda infot ei anna.</p>
<h3>Kas kasutatud pumbale kehtib tehase garantii?</h3>
<p>Praktikas mitte. Garantii on seotud esmase müügiga ja selle tingimustega, seega teisene ostja jääb tavaliselt ilma igasuguse kaitseta. Kui ostad uue pumba meie käest, teenindame garantiid täies mahus, see on osa hinnast.</p>
<h3>Kui palju vana küttepump elektrit raiskab?</h3>
<p>Vana kolme käiguga tsirkulatsioonipump tarbib tüüpiliselt 60–90 vatti, uus elektrooniline <a href="/tooted/kuttepumbad">ALPHA</a> 5–45 vatti. Vahe on kuni kaheksakümmend protsenti ja kuna pump käib küttehooajal peaaegu ööpäev läbi, tasub elektri kokkuhoid uue pumba enamasti ühe kuni kolme aastaga tagasi.</p>
<h3>Kust osta uut Grundfos pumpa Eestis?</h3>
<p>Pump OÜ on Grundfosi ametlik edasimüüja Eestis. Meil on üle viiesaja toote kohe laos, tarne ühe kuni kolme tööpäevaga, tehase garantii ja tasuta nõustamine valiku tegemiseks. Sirvi kategooriaid <a href="/tooted">e-poes</a> või helista.</p>

[shop_button]
`.trim()

const contentEn = `
<h2>Is a used Grundfos pump worth buying?</h2>
<p>A Grundfos pump at half price in a classified ad looks like a good deal at first glance. Before answering, it is worth remembering that a pump is not a piece of furniture. It is a working machine, and its true cost is not the purchase price. It shows up in the electricity bill, in repair costs, and in whether the pump works at all on the day you need it most.</p>
<p style="text-align: center"><img src="/images/alpha-go/benefit-replacement.jpg" alt="Identifying an old Grundfos pump with the Grundfos GO app before replacing it with a new ALPHA GO" width="1200" height="900" style="max-width: 560px; width: 100%"></p>

<h2>What the buyer cannot know</h2>
<p>Two <a href="/en/unilift">Unilifts</a> or <a href="/en/tooted/kuttepumbad">ALPHAs</a> that look identical can be years of running hours apart. One has sat in a dry utility room and run a few times a month, the other has pumped basement water for hours after every heavy rain. Bearings, seals and control electronics wear quietly and show no sign of it, not in the ad photo and not on inspection either. The seller may not know what their pump has been through, and even an honest answer to that question does not protect the buyer.</p>

<h2>The warranty that is not there</h2>
<p>A new pump comes with a factory warranty and our support as an official Grundfos distributor. If something goes wrong, we sort it out. The warranty on a used pump usually fits in one sentence at the bottom of the ad: none. The first serious failure, whether a burnt motor or a dead control board, usually costs more than the whole difference between new and used.</p>

<h2>The expensive part the ad does not mention: electricity</h2>
<p>The difference is biggest with heating pumps. An old three-speed circulator typically uses 60–90 watts, a new electronic Grundfos <a href="/en/tooted/kuttepumbad">ALPHA</a> only 5–45 watts. Since the circulator runs almost around the clock through the heating season, this adds up to tens of euros a year, and a new pump usually pays for itself within one to three years through the electricity saving alone. A used old pump never improves that equation. Quite the opposite, every month you postpone the replacement is paid again in the next electricity bill.</p>
<p>The same logic applies to other pumps too, just with slightly quieter numbers. That is why the right comparison is not the purchase price but the lifetime cost, meaning the price together with electricity, repairs and downtime. By that calculation, the new pump wins almost every time.</p>

<h2>What to look at in our new range?</h2>
<p>Every category has a buying guide with real prices, so you can compare in peace:</p>
<ul>
  <li><a href="/en/tooted/kuttepumbad">Heating and circulation pumps</a> — <a href="/en/tooted/kuttepumbad/alpha1-go">ALPHA1 GO</a> from 170 €, replacing most old UPS pumps with the same port-to-port length</li>
  <li><a href="/en/tooted/veeautomaadid">Water automatics and hydrofors</a> — <a href="/en/tooted/veeautomaadid/grundfos-scala1">SCALA1</a>, <a href="/en/tooted/veeautomaadid/grundfos-scala2">SCALA2</a> and <a href="/en/tooted/veeautomaadid/grundfos-jp">JP</a> from 235 €</li>
  <li><a href="/en/tooted/drenaazipumbad">Drainage pumps</a> — <a href="/en/tooted/drenaazipumbad/unilift-cc">Unilift CC</a> from 173 €</li>
  <li><a href="/en/tooted/puurkaevupumbad">Borehole pumps</a> — <a href="/en/tooted/puurkaevupumbad/grundfos-sq">SQ</a> from 741 €, dry-running protection built in</li>
  <li><a href="/en/tooted/salvkaevupumbad">Well pumps</a> — <a href="/en/tooted/salvkaevupumbad/grundfos-jp">JP</a>, <a href="/en/tooted/salvkaevupumbad/grundfos-sb">SB</a> and <a href="/en/tooted/salvkaevupumbad/grundfos-sba">SBA</a> from 235 €</li>
</ul>
<p>If your old pump is starting to misbehave and you are unsure whether a repair or a replacement pays off better, call +372 527 4403 or write to us. We will look at your specific situation together, and that advice costs nothing.</p>

<h3>Is a used Grundfos pump a good buy?</h3>
<p>For a primary pump, usually not. Unknown running hours, no warranty and older-generation energy use make the lifetime cost higher than a new pump, even when the price looks tempting. The exception is a rarely used backup pump whose history you know and trust.</p>
<h3>How long does a Grundfos pump last?</h3>
<p>Installed and maintained correctly, a Grundfos pump typically works for ten to fifteen years, often longer. A used-pump buyer, however, cannot know how much of that time has already been spent, and that is exactly what the price should reflect, but the ad does not tell you.</p>
<h3>Does a used pump have a factory warranty?</h3>
<p>In practice, no. The warranty is tied to the original sale and its terms, so a second-hand buyer is usually left without any protection. When you buy a new pump from us, we service the warranty in full; that is part of the price.</p>
<h3>How much electricity does an old heating pump waste?</h3>
<p>An old three-speed circulator typically uses 60–90 watts, a new electronic <a href="/en/tooted/kuttepumbad">ALPHA</a> 5–45 watts. The difference is up to eighty percent, and since the pump runs almost around the clock through the heating season, the electricity saving usually pays back a new pump within one to three years.</p>
<h3>Where to buy a new Grundfos pump in Estonia?</h3>
<p>Pump OÜ is an official Grundfos distributor in Estonia. We keep over five hundred products in stock, deliver within one to three business days, and the factory warranty and free selection advice are included. Browse the categories in <a href="/en/tooted">our shop</a> or give us a call.</p>

[shop_button]
`.trim()

const contentRu = `
<h2>Стоит ли покупать б/у насос Grundfos?</h2>
<p>Насос Grundfos за полцены в объявлении на первый взгляд выглядит выгодной сделкой. Но прежде чем ответить, стоит помнить, что насос не предмет мебели. Это рабочая машина, и её настоящая цена видна не в ценнике, а в счетах за электричество, в расходах на ремонт и в том, будет ли она вообще работать в тот день, когда она нужнее всего.</p>
<p style="text-align: center"><img src="/images/alpha-go/benefit-replacement.jpg" alt="Определение старого насоса Grundfos через приложение Grundfos GO перед заменой на новый ALPHA GO" width="1200" height="900" style="max-width: 560px; width: 100%"></p>

<h2>Чего покупатель не может знать</h2>
<p>Два внешне одинаковых <a href="/ru/unilift">Unilift</a> или <a href="/ru/tooted/kuttepumbad">ALPHA</a> могут различаться на годы наработки. Один стоял в сухом подсобном помещении и включался пару раз в месяц, другой после каждого сильного дождя часами откачивал воду из подвала. Подшипники, уплотнения и управляющая электроника изнашиваются незаметно и не выдают себя ни на фото в объявлении, ни при осмотре. Продавец сам может не знать, что пережил его насос, и даже честный ответ на этот вопрос покупателя не спасает.</p>

<h2>Гарантия, которой нет</h2>
<p>Покупатель нового насоса получает заводскую гарантию и нашу поддержку как официального дистрибьютора Grundfos. Если что-то случится, мы это решим. Гарантия на б/у насос обычно умещается в одно предложение внизу объявления: её нет. Первая серьёзная поломка, будь то сгоревший двигатель или умершая плата управления, обычно стоит больше, чем вся разница между новым и б/у.</p>

<h2>Самая дорогая часть, о которой объявление молчит: электричество</h2>
<p>Разница сильнее всего заметна у насосов отопления. Старый трёхскоростной циркуляционный насос потребляет обычно 60–90 ватт, новый электронный Grundfos <a href="/ru/tooted/kuttepumbad">ALPHA</a> всего 5–45 ватт. Поскольку насос работает почти круглосуточно весь отопительный сезон, за год набегают десятки евро, и новый насос обычно окупается за один-три года только за счёт экономии электричества. Старый б/у насос это уравнение никогда не улучшает, наоборот, каждый отложенный месяц замены оплачивается заново в следующем счёте за электричество.</p>
<p>Та же логика действует и для других насосов, просто с чуть менее заметными цифрами. Поэтому сравнивать нужно не цену покупки, а стоимость владения, то есть цену вместе с электричеством, ремонтом и простоями. При таком расчёте новый насос выигрывает почти всегда.</p>

<h2>На что посмотреть в нашем новом ассортименте?</h2>
<p>У каждой категории есть руководство по выбору с реальными ценами, чтобы можно было спокойно сравнить:</p>
<ul>
  <li><a href="/ru/tooted/kuttepumbad">Насосы отопления и циркуляционные</a> — <a href="/ru/tooted/kuttepumbad/alpha1-go">ALPHA1 GO</a> от 170 евро, заменяет большинство старых UPS с той же монтажной длиной</li>
  <li><a href="/ru/tooted/veeautomaadid">Водяные автоматы и гидрофоры</a> — <a href="/ru/tooted/veeautomaadid/grundfos-scala1">SCALA1</a>, <a href="/ru/tooted/veeautomaadid/grundfos-scala2">SCALA2</a> и <a href="/ru/tooted/veeautomaadid/grundfos-jp">JP</a> от 235 евро</li>
  <li><a href="/ru/tooted/drenaazipumbad">Дренажные насосы</a> — <a href="/ru/tooted/drenaazipumbad/unilift-cc">Unilift CC</a> от 173 евро</li>
  <li><a href="/ru/tooted/puurkaevupumbad">Скважинные насосы</a> — <a href="/ru/tooted/puurkaevupumbad/grundfos-sq">SQ</a> от 741 евро, защита от сухого хода встроена</li>
  <li><a href="/ru/tooted/salvkaevupumbad">Колодезные насосы</a> — <a href="/ru/tooted/salvkaevupumbad/grundfos-jp">JP</a>, <a href="/ru/tooted/salvkaevupumbad/grundfos-sb">SB</a> и <a href="/ru/tooted/salvkaevupumbad/grundfos-sba">SBA</a> от 235 евро</li>
</ul>
<p>Если старый насос начал сбоить и вы сомневаетесь, что выгоднее, ремонт или замена, позвоните +372 527 4403 или напишите нам. Разберём вашу конкретную ситуацию вместе, эта консультация ничего не стоит.</p>

<h3>Стоит ли покупать б/у насос Grundfos?</h3>
<p>Для основного насоса обычно нет. Неизвестная наработка, отсутствие гарантии и энергопотребление старого поколения делают стоимость владения выше, чем у нового насоса, даже если цена кажется привлекательной. Исключение — редко используемый резервный насос, чью историю вы знаете и которому доверяете.</p>
<h3>Сколько служит насос Grundfos?</h3>
<p>При правильной установке и обслуживании насос Grundfos обычно работает десять-пятнадцать лет, часто дольше. Но покупатель б/у насоса не знает, какая часть этого срока уже израсходована, а ведь именно это должна отражать цена, но объявление этого не говорит.</p>
<h3>Действует ли заводская гарантия на б/у насос?</h3>
<p>На практике нет. Гарантия привязана к первоначальной продаже и её условиям, поэтому покупатель с рук обычно остаётся без какой-либо защиты. Покупая новый насос у нас, вы получаете полное гарантийное обслуживание, это часть цены.</p>
<h3>Сколько электричества тратит старый насос отопления?</h3>
<p>Старый трёхскоростной циркуляционный насос потребляет обычно 60–90 ватт, новый электронный <a href="/ru/tooted/kuttepumbad">ALPHA</a> 5–45 ватт. Разница до восьмидесяти процентов, и поскольку насос работает почти круглосуточно весь отопительный сезон, экономия электричества обычно окупает новый насос за один-три года.</p>
<h3>Где купить новый насос Grundfos в Эстонии?</h3>
<p>Pump OÜ — официальный дистрибьютор Grundfos в Эстонии. У нас более пятисот товаров на складе, доставка за один-три рабочих дня, заводская гарантия и бесплатная помощь с выбором. Смотрите категории в <a href="/ru/tooted">магазине</a> или звоните.</p>

[shop_button]
`.trim()

const contentLv = `
<h2>Vai ir vērts pirkt lietotu Grundfos sūkni?</h2>
<p>Grundfos sūknis par puscenu sludinājumā no pirmā acu uzmetiena izskatās pēc laba pirkuma. Bet pirms atbildes vērts atcerēties, ka sūknis nav mēbele. Tas ir darba mehānisms, un tā īstā cena nav redzama cenu zīmē, bet gan elektrības rēķinā, remonta izmaksās un tajā, vai sūknis vispār strādā tanī dienā, kad tas ir vajadzīgs visvairāk.</p>
<p style="text-align: center"><img src="/images/alpha-go/benefit-replacement.jpg" alt="Vecā Grundfos sūkņa identificēšana ar Grundfos GO lietotni pirms nomaiņas pret jaunu ALPHA GO" width="1200" height="900" style="max-width: 560px; width: 100%"></p>

<h2>Ko pircējs nevar zināt</h2>
<p>Divi ārēji vienādi <a href="/lv/unilift">Unilift</a> vai <a href="/lv/tooted/kuttepumbad">ALPHA</a> var būt gadu darba stundu atšķirībā. Viens ir stāvējis sausā saimniecības telpā un ieslēdzies pāris reizes mēnesī, otrs pēc katras lietusgāzes stundām sūknējis pagraba ūdeni. Gultņi, blīves un vadības elektronika nolietojas klusi un neizrāda nekas, ne sludinājuma fotogrāfijā, ne apskates laikā. Pārdevējs pats var nezināt, ko viņa sūknis ir piedzīvojis, un pat godīga atbilde uz šo jautājumu pircēju nepassargā.</p>

<h2>Garantija, kuras nav</h2>
<p>Jaunā sūkņa pircējs saņem rūpnīcas garantiju un mūsu atbalstu kā oficiālā Grundfos izplatītāja. Ja kaut kas notiek, mēs to atrisinām. Lietota sūkņa garantija parasti ietilpst vienā teikumā sludinājuma apakšā: nav. Pirmā nopietnā kļūme, vai tas būtu piedegušais motors vai mirusi vadības plate, parasti maksā vairāk nekā visa starpība starp jauno un lietoto cenu.</p>

<h2>Dārgākā daļa, par kuru sludinājums klusē: elektroenerģija</h2>
<p>Atšķirība ir vislielākā apkures sūkņiem. Vecais trīs ātrumu cirkulācijas sūknis parasti patērē 60–90 vatus, jaunais elektroniskais Grundfos <a href="/lv/tooted/kuttepumbad">ALPHA</a> tikai 5–45 vatus. Tā kā sūknis visu apkures sezonu darbojas gandrīz nepārtraukti, gadā tas sastāda desmitiem eiro, un jaunais sūknis parasti atmaksājas viena līdz trīs gadu laikā tikai ar elektroenerģijas ietaupījumu. Lietots vecs sūknis šo vienādojumu nekad neuzlabo, gluži pretēji, katrs atliktais nomaiņas mēnesis tiek apmaksāts vēlreiz nākamajā elektrības rēķinā.</p>
<p>Tā pati loģika darbojas arī citiem sūkņiem, tikai ar nedaudz klusākiem skaitļiem. Tāpēc jāsalīdzina nevis pirkuma cena, bet lietošanas laika izmaksas, tas ir, cena kopā ar elektroenerģiju, remontu un dīkstāvēm. Pēc šāda aprēķina jaunais sūknis uzvar gandrīz vienmēr.</p>

<h2>Uz ko paskatīties mūsu jaunajā klāstā?</h2>
<p>Katrai kategorijai ir izvēles ceļvedis ar reālām cenām, lai varētu mierīgi salīdzināt:</p>
<ul>
  <li><a href="/lv/tooted/kuttepumbad">Apkures un cirkulācijas sūkņi</a> — <a href="/lv/tooted/kuttepumbad/alpha1-go">ALPHA1 GO</a> no 170 eiro, aizstāj lielāko daļu veco UPS ar tādu pašu uzstādīšanas garumu</li>
  <li><a href="/lv/tooted/veeautomaadid">Ūdens automāti un hidrofori</a> — <a href="/lv/tooted/veeautomaadid/grundfos-scala1">SCALA1</a>, <a href="/lv/tooted/veeautomaadid/grundfos-scala2">SCALA2</a> un <a href="/lv/tooted/veeautomaadid/grundfos-jp">JP</a> no 235 eiro</li>
  <li><a href="/lv/tooted/drenaazipumbad">Drenāžas sūkņi</a> — <a href="/lv/tooted/drenaazipumbad/unilift-cc">Unilift CC</a> no 173 eiro</li>
  <li><a href="/lv/tooted/puurkaevupumbad">Urbuma sūkņi</a> — <a href="/lv/tooted/puurkaevupumbad/grundfos-sq">SQ</a> no 741 eiro, aizsardzība pret sauso gājienu iebūvēta</li>
  <li><a href="/lv/tooted/salvkaevupumbad">Akas sūkņi</a> — <a href="/lv/tooted/salvkaevupumbad/grundfos-jp">JP</a>, <a href="/lv/tooted/salvkaevupumbad/grundfos-sb">SB</a> un <a href="/lv/tooted/salvkaevupumbad/grundfos-sba">SBA</a> no 235 eiro</li>
</ul>
<p>Ja vecais sūknis sācis ķerties un šaubāties, vai ir vērts remontēt vai mainīt, zvaniet +372 527 4403 vai rakstiet mums. Izskatīsim jūsu konkrēto situāciju kopā, un šī konsultācija neko nemaksā.</p>

<h3>Vai lietots Grundfos sūknis ir labs pirkums?</h3>
<p>Galvenajam sūknim parasti nē. Nezināmās darba stundas, garantijas trūkums un vecākas paaudzes enerģijas patēriņš padara lietošanas izmaksas lielākas nekā jaunam sūknim, pat ja cena šķiet pievilcīga. Izņēmums ir reti lietots rezerves sūknis, kura vēsturi zināt un kuram uzticaties.</p>
<h3>Cik ilgi kalpo Grundfos sūknis?</h3>
<p>Pareizi uzstādīts un apkopts Grundfos sūknis parasti darbojas desmit līdz piecpadsmit gadus, bieži ilgāk. Bet lietota sūkņa pircējs nezina, cik liela daļa no šī laika jau ir izlietota, un tieši to cenai vajadzētu atspoguļot, bet sludinājums to nepasaka.</p>
<h3>Vai lietotam sūknim ir rūpnīcas garantija?</h3>
<p>Praksē nē. Garantija ir saistīta ar pirmo pārdošanu un tās nosacījumiem, tāpēc otrās rokas pircējs parasti paliek bez jebkādas aizsardzības. Pērkot jaunu sūkni pie mums, mēs pilnībā apkalpojam garantiju, tā ir daļa no cenas.</p>
<h3>Cik daudz elektroenerģijas tērē vecs apkures sūknis?</h3>
<p>Vecais trīs ātrumu cirkulācijas sūknis parasti patērē 60–90 vatus, jaunais elektroniskais <a href="/lv/tooted/kuttepumbad">ALPHA</a> 5–45 vatus. Atšķirība ir līdz astoņdesmit procentiem, un tā kā sūknis visu apkures sezonu darbojas gandrīz nepārtraukti, elektroenerģijas ietaupījums parasti atmaksā jaunu sūkni viena līdz trīs gadu laikā.</p>
<h3>Kur nopirkt jaunu Grundfos sūkni Igaunijā?</h3>
<p>Pump OÜ ir oficiālais Grundfos izplatītājs Igaunijā. Mums ir vairāk nekā pieci simti preču noliktavā, piegāde vienas līdz trīs darba dienu laikā, rūpnīcas garantija un bezmaksas padoms izvēlē. Pārlūkojiet kategorijas <a href="/lv/tooted">veikalā</a> vai zvaniet.</p>

[shop_button]
`.trim()

const contentLt = `
<h2>Ar verta pirkti naudotą Grundfos siurblį?</h2>
<p>Grundfos siurblys už pusę kainos skelbime iš pirmo žvilgsnio atrodo kaip geras pirkinys. Bet prieš atsakant verta prisiminti, kad siurblys nėra baldas. Tai darbinė mašina, o jos tikroji kaina matoma ne kainoraštyje, o elektros sąskaitoje, remonto išlaidose ir tame, ar siurblys apskritai veiks tą dieną, kada jo labiausiai reikia.</p>
<p style="text-align: center"><img src="/images/alpha-go/benefit-replacement.jpg" alt="Senojo Grundfos siurblio identifikavimas Grundfos GO programėle prieš keičiant nauju ALPHA GO" width="1200" height="900" style="max-width: 560px; width: 100%"></p>

<h2>Ko pirkėjas negali žinoti</h2>
<p>Du išoriškai vienodi <a href="/lt/unilift">Unilift</a> ar <a href="/lt/tooted/kuttepumbad">ALPHA</a> gali skirtis metų darbo valandomis. Vienas stovėjo sausoje ūkinėje patalpoje ir įsijungdavo kelis kartus per mėnesį, kitas po kiekvieno smarkaus lietaus valandų valandas pumpuodavo rūsio vandenį. Guoliai, sandarikliai ir valdymo elektronika dėvisi tyliai ir to neišduoda nei skelbimo nuotraukoje, nei apžiūrint. Pardavėjas pats gali nežinoti, ką jo siurblys patyrė, ir net sąžiningas atsakymas į šį klausimą pirkėjo neišgelbsti.</p>

<h2>Garantija, kurios nėra</h2>
<p>Naujo siurblio pirkėjas gauna gamyklinę garantiją ir mūsų paramą kaip oficialaus Grundfos platintojo. Jei kažkas atsitiks, mes tai išspręsime. Naudoto siurblio garantija paprastai telpa į vieną sakinį skelbimo apačioje: nėra. Pirmas rimtesnis gedimas, ar tai būtų perdegęs variklis, ar mirusi valdymo plokštė, paprastai kainuoja daugiau nei visas skirtumas tarp naujo ir naudoto.</p>

<h2>Brangiausia dalis, apie kurią skelbimas tylimas: elektra</h2>
<p>Skirtumas didžiausias šildymo siurbliams. Senas trigreitis cirkuliacinis siurblys paprastai naudoja 60–90 vatų, naujas elektroninis Grundfos <a href="/lt/tooted/kuttepumbad">ALPHA</a> tik 5–45 vatų. Kadangi siurblys visą šildymo sezoną dirba beveik nenutrūkstamai, per metus susikaupia dešimtys eurų, ir naujas siurblys paprastai atsiperka per vienus–trejus metus vien per elektros santaupas. Naudotas senas siurblys šios lygties niekada nepagerina, priešingai, kiekvienas atidėtas keitimo mėnuo apmokamas dar kartą kitoje elektros sąskaitoje.</p>
<p>Ta pati logika galioja ir kitiems siurbliams, tik su šiek tiek tylesniais skaičiais. Todėl lyginti reikia ne pirkimo kainą, o naudojimo laiko kainą, tai yra kainą kartu su elektra, remontu ir prastovomis. Pagal tokį skaičiavimą naujas siurblys laimi beveik visada.</p>

<h2>Į ką pažvelgti mūsų naujame asortimente?</h2>
<p>Kiekviena kategorija turi pasirinkimo vadovą su realiomis kainomis, kad galėtumėte ramiai palyginti:</p>
<ul>
  <li><a href="/lt/tooted/kuttepumbad">Šildymo ir cirkuliaciniai siurbliai</a> — <a href="/lt/tooted/kuttepumbad/alpha1-go">ALPHA1 GO</a> nuo 170 eurų, pakeičia daugumą senų UPS tuo pačiu montavimo ilgiu</li>
  <li><a href="/lt/tooted/veeautomaadid">Vandens automatai ir hidroforai</a> — <a href="/lt/tooted/veeautomaadid/grundfos-scala1">SCALA1</a>, <a href="/lt/tooted/veeautomaadid/grundfos-scala2">SCALA2</a> ir <a href="/lt/tooted/veeautomaadid/grundfos-jp">JP</a> nuo 235 eurų</li>
  <li><a href="/lt/tooted/drenaazipumbad">Drenažiniai siurbliai</a> — <a href="/lt/tooted/drenaazipumbad/unilift-cc">Unilift CC</a> nuo 173 eurų</li>
  <li><a href="/lt/tooted/puurkaevupumbad">Gręžinio siurbliai</a> — <a href="/lt/tooted/puurkaevupumbad/grundfos-sq">SQ</a> nuo 741 euro, apsauga nuo sausojo eigos integruota</li>
  <li><a href="/lt/tooted/salvkaevupumbad">Šulinio siurbliai</a> — <a href="/lt/tooted/salvkaevupumbad/grundfos-jp">JP</a>, <a href="/lt/tooted/salvkaevupumbad/grundfos-sb">SB</a> ir <a href="/lt/tooted/salvkaevupumbad/grundfos-sba">SBA</a> nuo 235 eurų</li>
</ul>
<p>Jei senas siurblys pradėjo striguoti ir abejojate, ar verta remontuoti, ar keisti, skambinkite +372 527 4403 arba rašykite mums. Kartu peržvelgsime jūsų konkrečią situaciją, ir ši konsultacija nieko nekainuoja.</p>

<h3>Ar naudotas Grundfos siurblys yra geras pirkinys?</h3>
<p>Pagrindiniam siurbliui paprastai ne. Nežinomos darbo valandos, garantijos nebuvimas ir senesnės kartos energijos suvartojimas padidina naudojimo kainą labiau nei naujo siurblio, net jei kaina atrodo patraukli. Išimtis yra retai naudojamas atsarginis siurblys, kurio istoriją žinote ir juo pasitikite.</p>
<h3>Kiek laiko tarnauja Grundfos siurblys?</h3>
<p>Teisingai sumontuotas ir prižiūrimas Grundfos siurblys paprastai dirba dešimt–penkiolika metų, dažnai ilgiau. Bet naudoto siurblio pirkėjas nežino, kokia dalis to laiko jau panaudota, ir būtent tai turėtų atspindėti kaina, bet skelbimas to nepasako.</p>
<h3>Ar naudotam siurbliui galioja gamyklinė garantija?</h3>
<p>Praktiškai ne. Garantija susieta su pirminiu pardavimu ir jo sąlygomis, todėl iš antrų rankų pirkėjas paprastai lieka be jokios apsaugos. Pirkdami naują siurblį iš mūsų, garantiją aptarnaujame pilnai, tai yra kainos dalis.</p>
<h3>Kiek elektros švaisto senas šildymo siurblys?</h3>
<p>Senas trigreitis cirkuliacinis siurblys paprastai naudoja 60–90 vatų, naujas elektroninis <a href="/lt/tooted/kuttepumbad">ALPHA</a> 5–45 vatų. Skirtumas iki aštuoniasdešimties procentų, ir kadangi siurblys visą šildymo sezoną dirba beveik nenutrūkstamai, elektros santaupos paprastai atperka naują siurblį per vienus–trejus metus.</p>
<h3>Kur įsigyti naują Grundfos siurblį Estijoje?</h3>
<p>Pump OÜ yra oficialus Grundfos platintojas Estijoje. Turime daugiau nei penkis šimtus prekių sandėlyje, pristatome per vieną–tris darbo dienas, gamyklinė garantija ir nemokamas patarimas renkantis įskaičiuoti. Naršykite kategorijas <a href="/lt/tooted">parduotuvėje</a> arba skambinkite.</p>

[shop_button]
`.trim()

const payload = {
  slug: SLUG,
  title: 'Kasutatud vs uus Grundfos pump — aus võrdlus enne ostu',
  title_en: 'Used vs new Grundfos pump — an honest comparison before you buy',
  title_ru: 'Б/у или новый насос Grundfos — честное сравнение перед покупкой',
  title_lv: 'Lietots vai jauns Grundfos sūknis — godīgs salīdzinājums pirms pirkuma',
  title_lt: 'Naudotas ar naujas Grundfos siurblys — sąžiningas palyginimas prieš perkant',
  short_description: 'Kasutatud Grundfos pump tundub soodne, aga teadmata ajalugu, garantii puudumine ja vana tehnoloogia energiatarve teevad kogukulu suuremaks. Aus võrdlus ja hinnad.',
  short_description_en: 'A used Grundfos pump looks cheap, but unknown history, no warranty and old energy technology make the lifetime cost higher. An honest comparison with prices.',
  short_description_ru: 'Б/у насос Grundfos кажется выгодным, но неизвестная история, отсутствие гарантии и старое энергопотребление делают владение дороже. Честное сравнение с ценами.',
  short_description_lv: 'Lietots Grundfos sūknis šķiet lēts, bet nezināma vēsture, garantijas trūkums un vecā enerģijas tehnoloģija padara kopējās izmaksas lielākas. Godīgs salīdzinājums ar cenām.',
  short_description_lt: 'Naudotas Grundfos siurblys atrodo pigus, bet nežinoma istorija, garantijos nebuvimas ir sena energijos technologija padidina naudojimo kainą. Sąžiningas palyginimas su kainomis.',
  content: contentEt,
  content_en: contentEn,
  content_ru: contentRu,
  content_lv: contentLv,
  content_lt: contentLt,
  template: 'default',
  published: true,
  status: 'published',
  visibility: 'public',
  show_in_nav: false,
  show_title: true,
  meta_title: 'Kasutatud Grundfos pumbad — kas osta tasub? Võrdlus ja uute hinnad | Pump OÜ',
  meta_description: 'Kasutatud Grundfos pumba 3 peamist riski: teadmata ajalugu, garantii puudub, vana pump raiskab elektrit. Aus võrdlus kasutatud vs uus + uute Grundfos pumpade hinnad alates 170 €.',
}

async function main() {
  const { data: existing } = await supabase.from('pages').select('id, slug').eq('slug', SLUG).maybeSingle()
  if (existing) {
    console.log('Leht on olemas:', existing.id, '— uuendan sisu')
    if (DRY) { console.log('DRY RUN — ei uuendata'); return }
    const { error } = await supabase.from('pages').update(payload).eq('id', existing.id)
    if (error) { console.error('update error:', error.message); process.exit(1) }
    console.log('Uuendatud.')
    return
  }
  console.log(`Uus leht: /leht/${SLUG}`)
  if (DRY) { console.log('DRY RUN — ei salvestata'); return }
  const { data, error } = await supabase.from('pages').insert(payload).select('id, slug')
  if (error) { console.error('insert error:', error.message); process.exit(1) }
  console.log('Loodud:', JSON.stringify(data))
}
main().then(() => process.exit()).catch((e) => { console.error(e); process.exit(1) })
