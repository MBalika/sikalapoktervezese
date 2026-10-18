/* ===== Tartalmi adatok: alaptípusok, kvízek, igaz/hamis, fogalomtár ===== */
const TYPE_INFO = {
  sav: {
    name: 'Sávalap', kind: 'Falak alatt, folyamatosan',
    desc: 'Falak folyamatos alátámasztására készül. Általában konzolosan kinyúlik a fal alól, mert a talaj teherbírása kisebb a falazóanyagénál, és mindkét oldalon min. 5–5 cm elhelyezési biztonság kell. Anyaga tégla, terméskő, úsztatott vagy csömöszölt beton, illetve vasbeton.',
    when: 'Falazott épületek alá, például családi háznál vagy kisebb lakóháznál, teherbíró talajon, a fagyhatár alatt. A legegyszerűbb és legolcsóbb megoldás.',
    variants: [['csom', 'Csömöszölt beton'], ['tegla', 'Tégla'], ['ko', 'Terméskő'], ['vb', 'Vasbeton']]
  },
  pill: {
    name: 'Pilléralap', kind: 'Pillérek, oszlopok alatt',
    desc: 'Tömbalap a pillérek alatt; alaprajza általában négyzet, B/L = 1–3,5. Betonból vagy vasbetonból készül, alul legalább hálós acélbetéttel. A pillérrel befogott vagy csuklós kapcsolat létesíthető; előregyártott oszlop ma monolit tömbalapra helyezett kehelynyakba kerül.',
    when: 'Vázas épületek, ipari csarnokok koncentrált pillérterhei alá, ha a pillérek eltérő süllyedése nem okoz gondot.',
    variants: [['lepcsos', 'Vasbeton tömb'], ['kehely', 'Kehelynyak']]
  },
  szalag: {
    name: 'Szalagalap', kind: 'Talpgerenda a pillérsor alatt',
    desc: 'A pilléreket egy rendszerint erősen vasalt, sávszerű vasbeton gerendára állítjuk. Hajlítást kap, ezért mindig vasbeton; az építménynek hosszirányú merevséget ad.',
    when: 'Gyengébb altalajon vagy erőtani okokból, ha a pillérek között egy irányban megengedhetetlenül nagy süllyedéskülönbség keletkezne.',
    variants: []
  },
  racs: {
    name: 'Gerendarács-alap', kind: 'Egymást metsző szalagalapok',
    desc: 'Egymást metsző vasbeton szalagalapok együttese: a pillérraszter mindkét irányában összeköti az alapokat.',
    when: 'Ha a süllyedéskülönbséget mindkét irányban csökkenteni kell.',
    variants: []
  },
  lemez: {
    name: 'Lemezalap', kind: 'Az építmény alatt átmenő lemez',
    desc: 'Az építmény alatt átmenő, összefüggő vasbeton szerkezet, amely falakat és pilléreket egyaránt alátámaszt. Viszonylag vékony, ezért általában hajlékony. Lehet síklemez, alul- vagy felülbordás, rejtettbordás, illetve az átszúródás ellen gombafödém-jellegű.',
    when: 'Ha a terheket csak a teljes alapterületen lehet átadni. Teljesen alápincézett épületnél magas talajvíz mellett ellenfödémként, néhány szintes épületnél térszíni lemezként is.',
    variants: [['sik', 'Síklemez'], ['felul', 'Felülbordás'], ['alul', 'Alulbordás'], ['gomba', 'Gombafödém-jellegű']]
  },
  doboz: {
    name: 'Dobozalap', kind: 'Együttdolgozó pinceszerkezet',
    desc: 'Az alaplemez a rá épített pincefalakkal és födémmel monolit egészet képez – tartószerkezetileg szekrénytartó. Nagyon merev.',
    when: 'Kis alakváltozást tűrő építmények alá, leggyakrabban a házgyári panelépületek monolit vasbeton fogadószintjeként.',
    variants: []
  },
  hej: {
    name: 'Héjalap', kind: 'Görbült felületű lemez',
    desc: 'Matematikailag leírható, egyszeres vagy kétszeres görbületű felület, amelyben csak normálerők, azaz húzás és nyomás keletkeznek, hajlítás nem. Anyagtakarékos, de munka- és időigényes; szigorú geometriát kíván. A modell kúphéjat mutat egy hengeres torony alatt.',
    when: 'Ma már nem alkalmazzák, mert nem bizonyult gazdaságosnak. Érdekesség: a budapesti Körszálló is héjalapon épült.',
    variants: []
  }
};
const TYPE_ORDER = ['sav', 'pill', 'szalag', 'racs', 'lemez', 'doboz', 'hej'];

const QUIZ = {
  q1: { key: 'q1', title: 'Kvíz – síkalap vagy mélyalap?', items: [
    { q: 'Mikor nevezzük az alapozást síkalapozásnak?', o: ['Ha a teherbíró réteg a felszínhez (pincénél a felszerkezethez) közel, kb. 1–2 m-en belül van', 'Ha az alaptest vasbetonból készül', 'Ha a talajvízszint mélyen van', 'Ha az épület legfeljebb háromszintes'], a: 0, e: 'A síkalap közvetlenül a felszín közeli teherbíró rétegre adja át a terhet. Az anyag, a talajvíz vagy a szintszám önmagában nem dönt.' },
    { q: 'Mi a mélyalapozás lényege?', o: ['Teherközvetítő elemet iktatunk a szerkezet és a mélyebb teherbíró altalaj közé', 'A síkalapot egy méterrel mélyebbre tesszük', 'Mindig cölöpöket alkalmazunk', 'A gyenge talajt teljes vastagságban kicseréljük'], a: 0, e: 'A teherközvetítő elem lehet cölöp, résfal, kút- vagy szekrényalap. A talajcsere talajjavítás, nem mélyalapozás.' },
    { q: 'Melyik helyzet NEM indokolja a mélyalapot?', o: ['Kimosás veszélye egy híd mederpillérénél', 'A magas építési talajvízszint miatt a síkalap drága lenne', 'A teherbíró homokos kavics 1,2 m mélyen kezdődik, a süllyedések kicsik', 'Nagy ferdeségű teher miatt elcsúszási veszély állna fenn'], a: 2, e: 'Felszín közeli teherbíró réteg és kis süllyedés: ez a síkalap tipikus esete. A többi felsorolt helyzet a mélyalap mellett szól.' },
    { q: 'Melyik állítás igaz a mélyített síkalapra?', o: ['3–5 m mélyen készül síkalap-technológiával, és síkalapként számítjuk (a köpenymenti ellenállást elhanyagoljuk)', 'Egy cölöp felső, kiszélesített része', 'Résfalakkal körülvett pinceszint', 'Mindig lemezalap'], a: 0, e: 'Építéstechnológiai szempontból azonosan készül, mint a hagyományos síkalap, és teherbírását is a síkalapoknál használt feltevésekkel számítjuk.' },
    { q: 'A felszín közeli réteg gyenge, de mélyebben sincs jobb, a terhek közepesek. Mi jöhet szóba?', o: ['Lemezalap: az épület súlyát nagy felületen elosztjuk', 'Csak cölöpalap', 'Pilléralapok sűrűbb kiosztással, kisebb méretben', 'Az építkezés nem lehetséges'], a: 0, e: 'Pontosan ez a helyzet: ha mélyebben sincs jobb réteg, a terhet nagy felületen kell elosztani.' },
    { q: 'Mi a cölöppel gyámolított lemezalap?', o: ['Vegyes (hibrid) rendszer, amelyben a lemez és a cölöpök együtt adják át a terhet', 'Lemezalap, amely alatt ideiglenes cölöpök vannak az építés idejére', 'Cölöpalap, amelynek a fejgerendája lemez alakú', 'Két külön alapozás egymás mellett'], a: 0, e: 'Ilyen áll például a MOL Campus (2,2 m vastag lemez, 135 cölöp) és a Burj Khalifa (3,7 m vastag lemez, 192 cölöp) alatt.' }
  ]},
  q2: { key: 'q2', title: 'Kvíz – a síkalapok fajtái', items: [
    { q: 'Miért nyúlik ki általában konzolosan a sávalap a fal alól?', o: ['Mert a talaj teherbírása kisebb a falazóanyagénál, és min. 5–5 cm elhelyezési biztonság is kell', 'Hogy a fal ne süllyedjen egyáltalán', 'Mert így kevesebb anyag kell', 'Csak esztétikai okból'], a: 0, e: 'A kiszélesítés csökkenti a talpfeszültséget, az 5–5 cm pedig a földmunka pontatlanságát fedezi.' },
    { q: 'Hogyan kell kialakítani a tégla sávalap lépcsőit?', o: ['Magasságban a téglasor, vízszintesen a féltégla egész számú többszöröse szerint', 'Tetszőleges, 45°-os ferde felülettel', 'Vízszintesen a téglahossz többszöröse szerint', 'Lépcső nélkül, mindig a fal szélességével'], a: 0, e: 'Így a téglák vágás nélkül, kötésben rakhatók, és a lépcsők a teherelosztást is szolgálják.' },
    { q: 'Mikor előnyös a vasbeton sávalap?', o: ['Ha nagy támaszkodó felület kell, de az alap magassága (talajvíz, pince stb.) korlátozott', 'Ha a talaj nagyon jó', 'Ha a fal vékony', 'Ha a fagyhatár mély'], a: 0, e: 'Minél szélesebb egy vasalatlan alaptest, annál magasabbnak kell lennie; a vasbeton alap kisebb magassággal is áthidalja a kinyúlást.' },
    { q: 'Mi jellemző a pilléralap alaprajzára?', o: ['Általában négyzet, illetve B/L = 1–3,5', 'Mindig kör', 'Mindig hosszúkás, B/L > 5', 'A pillér keresztmetszetével azonos'], a: 0, e: 'Az alaprajz a pillér keresztmetszetéhez igazodik, leggyakrabban négyzet.' },
    { q: 'Mi a különbség a szalagalap és a gerendarács-alap között?', o: ['A szalagalap egy irányban, a gerendarács mindkét irányban csökkenti a süllyedéskülönbséget', 'A szalagalap vasbeton, a gerendarács beton', 'A gerendarács csak falak alá készül', 'Nincs különbség'], a: 0, e: 'A gerendarács egymást metsző szalagalapokból áll.' },
    { q: 'Mit nevezünk rejtettbordás lemeznek?', o: ['Ha a bordák helyén csak erősítő vasbetétek maradnak, a vastagság a bordákéval azonos', 'Ha a bordák a talajba vannak süllyesztve', 'Ha a lemezt felülről burkolat takarja', 'Ha a lemez alatt drénréteg van'], a: 0, e: 'A borda „elrejtve”, a lemez vasalásában van jelen.' },
    { q: 'Miért alkalmaztak dobozalapot a panelházak alatt?', o: ['Mert a házgyári elemekből készült épület csak kis alakváltozást képes károsodás nélkül elviselni', 'Mert olcsóbb a sávalapnál', 'Mert a panelházak alatt mindig magas a talajvíz', 'Mert a panelek nem rögzíthetők máshoz'], a: 0, e: 'A monolit fogadószint szekrénytartóként merevvé teszi az alapozást.' }
  ]},
  q3: { key: 'q3', title: 'Kvíz – a tervezés menete', items: [
    { q: 'Mit kell először megvizsgálni, mielőtt az alapozás tervezésébe kezdünk?', o: ['Rendelkezésre áll-e megfelelő talajvizsgálati jelentés', 'Mennyi betont rendeljünk', 'Milyen színű legyen a lábazat', 'Ki lesz a kivitelező'], a: 0, e: 'A megfelelő talajvizsgálati jelentés nélkül az alapozás nem tervezhető biztonságosan.' },
    { q: 'Mi következik a folyamatábrán közvetlenül az alapsík felvétele után?', o: ['Az alapfelület méretezése teherbírási határállapotban', 'A vasalás meghatározása', 'Az elcsúszás vizsgálata', 'A mélyalap tervezése'], a: 0, e: 'Az alapsík ismeretében határozzuk meg az alapok szükséges szélességét (lemezalapnál ez eleve adott).' },
    { q: 'Mi a teendő, ha a számított süllyedések nem megengedhetők?', o: ['Valamin változtatni kell, visszaugrunk a tervezés elejére; szükség esetén mélyalapra térünk át', 'Növeljük a betonminőséget', 'Elhagyjuk a süllyedésvizsgálatot', 'A süllyedést a kivitelezőre bízzuk'], a: 0, e: 'Változtatható a típus, az alapsík, az alapméret – vagy az egész alapozási mód.' },
    { q: 'Melyik a folyamat utolsó lépése?', o: ['A szilárdsági méretezés: a betonminőség és a vasalás meghatározása', 'Az alapsík felvétele', 'A süllyedésszámítás', 'Az alaptípus kiválasztása'], a: 0, e: 'Előtte a helyzeti állékonyságot és a felúszás elleni biztonságot is ellenőrizni kell (ha felmerül).' },
    { q: 'Melyik NEM a „környezet” szempontcsoportba tartozik?', o: ['A talajvíz mélysége', 'Csatlakozó szomszédos épület (foghíjtelek)', 'Védendő fák a telken', 'A telek megközelíthetősége, anyagtárolás'], a: 0, e: 'A talajvíz a „talaj- és talajvízviszonyok” csoportba tartozik.' }
  ]},
  q4: { key: 'q4', title: 'Kvíz – az alapsík felvétele', items: [
    { q: 'Melyik tényező szab a hazai gyakorlatban minden telekre érvényes alsó korlátot az alapozási sík mélységére?', o: ['A humuszos réteg alja', 'A fagyhatár', 'A talajvízszint', 'Egységesen 1,0 m'], a: 1, e: 'A fagyhatár mindig érvényes alsó korlát. A talajvízszint inkább felső korlát (lehetőleg felette alapozunk), a humusz alja pedig telkenként változik és többnyire sekélyebb.' },
    { q: 'Mennyi a fagyhatár kötött talajban, 300 mBf magasságon?', o: ['0,5 m', '0,8 m', '1,0 m', '1,2 m'], a: 1, e: 'Kötött talajban 500 mBf alatt 0,8 m, felette 1,0 m.' },
    { q: 'Szemcsés talaj, 110 mBf, a téli talajvíz 3 m-rel az alapsík alatt. Mekkora lehet a fagyhatár?', o: ['0,5 m-re csökkenthető', '0,8 m, nem csökkenthető', '1,0 m', '0,4 m'], a: 0, e: '500 mBf alatt, ha a téli talajvíz 2,0 m-nél jobban nem közelíti meg az alapsíkot, a szemcsés talaj fagyhatára 0,5 m-re csökkenthető.' },
    { q: 'Mekkora földtakarás kell a fagyhatásnak ki nem tett épületrészekben (pl. pincében)?', o: ['Legalább 0,4 m – ez az 50 cm-es alapmagasság miatt eleve teljesül', 'Legalább 0,8 m', 'Nem kell takarás', 'Legalább 1,5 m'], a: 0, e: 'A pincében nincs fagyveszély, de minimális takarás itt is kell.' },
    { q: 'Részben alápincézett épületnél mi a szabály a magasabban maradó alapra?', o: ['A belső élétől húzott természetes rézsű vonala ne messe a pincefalat a pincepadló szintje felett', 'Legyen pontosan a fagyhatáron', 'Az alapsík legyen azonos a pincepadlóval', 'Legalább 2 m-re legyen a pincefaltól'], a: 0, e: 'Különben a sekély alap terhe a pincefalra hárulna, kiemeléskor pedig alóla kifuthatna a talaj.' },
    { q: 'Lépcsőzetes mélyítésnél mekkora lehet legfeljebb a sarokpontokat összekötő egyenes hajlása?', o: ['30°', '45°', '60°', 'Bármekkora, ha a lépcső 50 cm alatti'], a: 0, e: 'Az alapok megfelelő sarokpontjait összekötő egyenes ne legyen 30°-nál meredekebb.' },
    { q: 'Az új épület mélyebb padlószintje miatt az alapsík a szomszéd régi háza alá kerül. Mi a teendő?', o: ['A régit alá kell betonozni vagy jet-groutinggal megerősíteni', 'Semmi, mert az új alap mélyebb', 'Az új alapot a régi fölé kell emelni', 'A régi épületet le kell bontani'], a: 0, e: 'Különben a munkagödör kiemelésekor a régi alap alól kifuthat a talaj.' }
  ]},
  q5: { key: 'q5', title: 'Kvíz – határállapotok és eljárások', items: [
    { q: 'Mit jelent a GEO határállapot?', o: ['A talaj törését vagy túlzott alakváltozását; az ellenállást a talaj szilárdsága határozza meg', 'A szerkezeti elemek belső törését', 'A merev testként való helyzetváltozást', 'A felúszás miatti egyensúlyvesztést'], a: 0, e: 'Ez az alap alatti talajtörés, átfúródás, kipréselődés határállapota.' },
    { q: 'Síkalapoknál leggyakrabban melyik két határállapotot kell vizsgálni?', o: ['GEO és STR', 'EQU és UPL', 'UPL és HYD', 'Csak az SLS-t'], a: 0, e: 'A talajtörést (GEO) és az alaptest szerkezeti megfelelőségét (STR).' },
    { q: 'Melyik használhatósági határállapot?', o: ['Elfogadhatatlan mértékű rezgés', 'Talajtörés az alap alatt', 'Az alaptest átszúródása', 'Felúszás'], a: 0, e: 'Az SLS-ek: túlzott süllyedés és süllyedéskülönbség, elfogadhatatlan rezgés, túlzott megemelkedés.' },
    { q: 'Mikor merül fel a felúszás (UPL) veszélye?', o: ['Mélyen a talajvízszint alá nyúló könnyebb szerkezeteknél (medence, aluljáró, mélygarázs)', 'Nehéz, talajvíz feletti szerkezeteknél', 'Lejtős terepen', 'Kőzetre alapozásnál'], a: 0, e: 'Gyakran csak építés közben kritikus, amikor a szerkezet még könnyű.' },
    { q: 'Mikor alkalmazzák jellemzően a szokáson alapuló (bevált) eljárást?', o: ['Kőzetre alapozásnál, valószínűsített talajtörési ellenállással', 'Puha agyagon álló toronyháznál', 'Mindig, ha nincs talajvizsgálat', 'Felúszás vizsgálatánál'], a: 0, e: 'A kőzet típusa, tagoltsága és egyirányú nyomószilárdsága alapján felvehető megengedett talpfeszültség (G melléklet).' },
    { q: 'Mi veszi át a DA1/DA2/DA3 tervezési módok helyét a 2. generációs EC7-ben?', o: ['Az igazolási esetek (VC1–VC4), anyag- (MFA) vagy ellenállástényezős (RFA) eljárással', 'Egyetlen globális biztonsági tényező', 'A megengedett feszültségek módszere', 'Semmi, minden marad'], a: 0, e: 'A határállapot-típusok (GEO, STR, EQU, UPL, HYD) megmaradnak, az igazolás rendje alakul át.' },
    { q: 'A mátrix szerint melyik osztályba kerül egy CC3-as építmény normál (GCC2) geotechnikai komplexitással?', o: ['GC1', 'GC2', 'GC3', 'Nem sorolható be'], a: 2, e: 'Nagy következmény és normál komplexitás: GC3. A táblázat nemzetileg módosítható paraméter.' }
  ]},
  q6: { key: 'q6', title: 'Kvíz – a talajtörés mechanizmusa', items: [
    { q: 'Melyik szakaszban arányos a süllyedés a teherrel?', o: ['I. – rugalmas tartomány', 'II. – átmeneti tartomány', 'III. – képlékeny tartomány', 'Egyikben sem'], a: 0, e: 'Ebben a szakaszban állandó teher alatt a süllyedés meg is áll (ds/dt = 0).' },
    { q: 'Mi jellemzi az általános nyírási törést?', o: ['A felszínig kifutó csúszólap, felpúposodás és határozott csúcs a teher–süllyedés görbén', 'A térszín süppedése csúszólap nélkül', 'Csak az alaptest szélei alatti plasztikus zónák', 'Állandó sebességű kúszás'], a: 0, e: 'Tömör szemcsés talajban, sekély alapnál ez a jellemző, az alaptest mellett egyik irányban.' },
    { q: 'Sekély sávalap T<sub>re</sub> = 0,5 relatív tömörségű homokon. Melyik törés várható?', o: ['Általános nyírási', 'Helyi nyírási', 'Benyomódás', 'Felúszás'], a: 1, e: 'Ha 0,35 < T<sub>re</sub> < 0,70, helyi nyírási törés várható.' },
    { q: 'Milyen törés alakul ki jellemzően nagy vasbeton lemezek alatt?', o: ['Helyi nyírási törés a szélek alatt', 'Mély, felszínig futó általános nyírási törés', 'Felúszás', 'Kipréselődés a lemez közepén'], a: 0, e: 'Mély csúszólap nem tud kialakulni, mert az építmény már a dm-es süllyedések miatt tönkremegy.' },
    { q: 'Mi jellemzi a benyomódást (befúródást)?', o: ['Esetleg csak a térszín süppedése; csúszólap a szokásos értelemben nincs', 'Erős felpúposodás az alap mindkét oldalán', 'A görbe hirtelen csúcsa kis süllyedésnél', 'Az alap elfordulása'], a: 0, e: 'Laza szemcsés és puha kötött talajban fordul elő; így nyomódnak a talajba a cölöpök is.' },
    { q: 'Ugyanabban a homokban mélyebbre tesszük az alapot (nő a D/B*). Merre tolódik a viselkedés?', o: ['A benyomódás felé', 'Az általános nyírási törés felé', 'Nem változik', 'A felúszás felé'], a: 0, e: 'Vesić térképén a nagyobb relatív mélységhez egyre nagyobb tömörség kell az általános nyírási töréshez.' },
    { q: 'Mekkora relatív süllyedésnél van a csúcs általános nyírási törésnél?', o: ['Kb. 0,05B', 'Kb. 0,15B', 'Kb. 0,5B', 'Kb. 0,005B'], a: 0, e: 'Helyi nyírási törésnél ez 0,07–0,15B, benyomódásnál 0,15–0,20B.' }
  ]}
};

/* A helyes válasz helye kvízenként változó: determinisztikus (minden betöltéskor azonos) keverés,
   egymás után két kérdésnél soha nem ugyanaz a betű. */
(function balanceQuiz() {
  const rnd = seed => () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  Object.values(QUIZ).forEach((qz, qi) => {
    const r = rnd(qi * 7919 + 101);
    let prev = -1;
    qz.items.forEach(it => {
      const n = it.o.length;
      let t; do t = Math.floor(r() * n); while (t === prev && n > 1);
      prev = t;
      const right = it.o[it.a];
      const rest = it.o.filter((_, k) => k !== it.a);
      for (let k = rest.length - 1; k > 0; k--) { const m = Math.floor(r() * (k + 1)); [rest[k], rest[m]] = [rest[m], rest[k]]; }
      rest.splice(t, 0, right);
      it.o = rest; it.a = t;
    });
  });
})();

const TF_ITEMS = [
  { s: 'A síkalap teherbíró rétege jellemzően a felszíntől 1–2 m-en belül van.', a: true, e: 'Pincés épületnél a felszerkezethez közel.' },
  { s: 'A mélyített síkalap teherbírásánál a köpenymenti ellenállást is figyelembe vesszük.', a: false, e: 'A síkalapoknál használt feltevésekkel élünk, azaz a köpenymenti ellenállást elhanyagoljuk.' },
  { s: 'A cölöppel gyámolított lemezalap vegyes (hibrid) alapozási rendszer.', a: true, e: 'A sík- és a mélyalapozás technológiáit ötvözi.' },
  { s: 'Ha a felszínközeli réteg gyenge, de mélyebben sincs jobb, lemezalap is szóba jöhet.', a: true, e: 'Az épület súlyát nagy felületen kell elosztani.' },
  { s: 'Hidak mederpilléreinél a kimosás veszélye a mélyalap mellett szól.', a: true, e: 'Síkalap alól a víz kimoshatja, kiüregelheti a talajt.' },
  { s: 'A tégla sávalap lépcsőit vízszintesen a téglahossz egész számú többszöröse szerint képezzük.', a: false, e: 'A féltégla egész számú többszöröse szerint.' },
  { s: 'A sávalap szélessége és magassága gyakorlati okokból legalább 50 cm.', a: true, e: 'Ökölszabály, kivitelezési okokból.' },
  { s: 'Úsztatott beton sávalapban a kövek a teljes alapmagasságban egyenletesen helyezkednek el.', a: false, e: 'Az úsztatott kő az alaptest magasságának kb. a felét kitevő sávban alkalmazható.' },
  { s: 'Csömöszölt beton sávalapot ma jellemzően zsaluzattal készítenek.', a: false, e: 'Földpartok között; zsaluzat csak akkor kell, ha a szemcsés talajban nem állnak meg a közel függőleges földpartok.' },
  { s: 'Ugyanakkora alapszélességnél a vasbeton sávalap alacsonyabb lehet, mint a vasalatlan.', a: true, e: 'Ezért előnyös, ha az alapmagasság korlátozott.' },
  { s: 'A válaszfalakat nem kell külön lealapozni, mert csak önhordó szerkezetek.', a: false, e: 'Le kell alapozni: külön sávalappal, padozatvastagítással vagy vasbeton gerendával.' },
  { s: 'Pilléralapnál a B/L arány általában 1 és 3,5 között van.', a: true, e: 'Leggyakrabban négyzet alaprajzú.' },
  { s: 'Az acélpillér tőcsavaros lekötése az esetleges húzóerők átadására szolgál.', a: true, e: 'Egy- vagy kétirányú nyomatékbíró kapcsolatot is adhat.' },
  { s: 'A szalagalap mindkét irányban csökkenti a süllyedéskülönbségeket.', a: false, e: 'Csak egy irányban; mindkét irányban a gerendarács-alap.' },
  { s: 'A lemezalapok viszonylag kis vastagságuk miatt általában igen hajlékonyak.', a: true, e: 'Bordákkal merevíthetők.' },
  { s: 'A gombafödém-jellegű lemezalap az átszúródás megakadályozását szolgálja.', a: true, e: 'Pillérvázas épületeknél, nagyobb terheknél.' },
  { s: 'Térszíni lemezalapnál a lemez alsó síkja a fagyhatár felett maradhat.', a: true, e: 'Egy jól tömörített, min. 50–60 cm vastag szemcsés ágyazati rétegre kerül.' },
  { s: 'A héjalapokat anyagtakarékosságuk miatt ma is gyakran alkalmazzák.', a: false, e: 'Munka- és időigényesek, nem bizonyultak gazdaságosnak – ma már nem alkalmazzák.' },
  { s: 'A dobozalap tartószerkezetileg szekrénytartónak tekinthető.', a: true, e: 'Az alaplemez, a pincefalak és a födém monolit egészet alkot.' },
  { s: 'Az alapozás tervezése előtt ellenőrizni kell, megfelelő-e a talajvizsgálati jelentés.', a: true, e: 'Ez az első lépés.' },
  { s: 'A tervezési folyamatban a süllyedésvizsgálat az alapfelület méretezése előtt történik.', a: false, e: 'Utána: a kialakított méretek alapján számítjuk a feszültségeket és a süllyedéseket.' },
  { s: 'A szilárdsági méretezés (betonminőség, vasalás) a tervezési folyamat utolsó lépése.', a: true, e: 'Előtte az állékonyságot és a felúszást is ellenőrizzük.' },
  { s: 'Az alapozási mélység az alapsík és az eredeti terep közötti függőleges távolság.', a: false, e: 'A végleges térszín és az alapsík közötti távolság.' },
  { s: 'Kötött talajban 500 mBf felett a fagyhatár 1,0 m.', a: true, e: '500 mBf alatt 0,8 m.' },
  { s: 'Szilárd kőzeten álló alapnál a fagyhatár 0,8 m.', a: false, e: '0,5 m.' },
  { s: 'Szemcsés talajban a fagyhatár mindig 0,8 m, ettől eltérni nem lehet.', a: false, e: '500 mBf alatt 0,5 m-re csökkenthető, ha a téli talajvíz 2,0 m-nél jobban nem közelíti meg az alapsíkot.' },
  { s: 'A jéglencsék kialakulásához fagyveszélyes talaj, utánpótlódó víz és lefelé haladó fagyfront kell.', a: true, e: 'Ha bármelyik hiányzik, jelentős fagyemelés nem alakul ki.' },
  { s: 'Az alapsíkot lehetőleg a talajvízszint alá kell tervezni, mert ott tömörebb a talaj.', a: false, e: 'Lehetőleg a talajvíz felett – a víztelenítés költséges.' },
  { s: 'Térfogatváltozó agyagon az alapsíkot a kiszáradási határ (kb. 2 m) alá kell tervezni.', a: true, e: 'Az évszakos zsugorodás–duzzadás e mélység felett hat.' },
  { s: 'Lépcsőzetes mélyítésnél a sarokpontokat összekötő egyenes legfeljebb 45°-os lehet.', a: false, e: 'Legfeljebb 30°-os.' },
  { s: 'Lejtős terepen ferde alapsík is tervezhető, ha a lejtés kicsi.', a: false, e: 'Sosem szabad ferde alapsíkot tervezni, azt mindig lépcsőzni kell.' },
  { s: 'Lejtős terepen egy lépcső magassága ne legyen nagyobb 50 cm-nél.', a: true, e: 'Igaz: ennél magasabb lépcső lejtős terepen nem lehet.' },
  { s: 'Az új épület alapsíkja kerülhet a szomszéd régi épületé fölé, ha az új épület könnyebb.', a: false, e: 'Nem kerülhet a régi fölé, szükség esetén mélyíteni kell.' },
  { s: 'Az alap alatti talajtörés GEO teherbírási határállapot.', a: true, e: 'Az ellenállást a talaj szilárdsága határozza meg.' },
  { s: 'Az elfogadhatatlan mértékű rezgés teherbírási határállapot.', a: false, e: 'Használhatósági határállapot.' },
  { s: 'Síkalapoknál leggyakrabban a GEO és az STR határállapotot kell vizsgálni.', a: true, e: 'A talajtörést és az alaptest szerkezeti megfelelőségét.' },
  { s: 'A felúszás (UPL) veszélye főleg nehéz, talajvíz feletti szerkezeteknél lép fel.', a: false, e: 'Könnyű, mélyen a talajvíz alá nyúló szerkezeteknél.' },
  { s: 'A közvetett tervezési eljárás például szondázási eredményekből, tapasztalati képlettel becsli a talajtörési ellenállást.', a: true, e: 'Előnye a kisebb számítási terjedelem.' },
  { s: 'Általános nyírási törésnél a csúszólap kifut a felszínig, és a talaj felpúposodik.', a: true, e: 'Tipikusan az alaptest mellett egyik irányban.' },
  { s: 'Benyomódásos törésnél határozott csúcs van a teher–süllyedés görbén.', a: false, e: 'Ott nincs csúcs; a görbe folyamatosan, egyre meredekebben halad.' }
];

const GLOSSARY = [
  ['Síkalap', 'A terhet közvetlenül a felszín közeli (1–2 m-en belüli) teherbíró rétegre átadó alap.'],
  ['Mélyalap', 'Teherközvetítő elemmel (cölöp, résfal, kút- és szekrényalap) a mélyebb teherbíró rétegre alapozó rendszer.'],
  ['Mélyített síkalap', '3–5 m mélyen, síkalap-technológiával készülő alap. Síkalapként számítjuk, köpenymenti ellenállás nélkül.'],
  ['Vegyes (hibrid) alapozás', 'A sík- és mélyalapozás ötvözete, pl. cölöppel gyámolított lemezalap.'],
  ['Sávalap', 'Falak folyamatos alátámasztására szolgáló, általában kiszélesített alaptest.'],
  ['Úsztatott beton', 'Terméskővel kevert beton („francia beton”). A kő a magasság kb. felében.'],
  ['Pilléralap (tömbalap)', 'Pillérek, oszlopok alatti, általában négyzetes alaptest (B/L = 1–3,5).'],
  ['Kehelyalap, kehelynyak', 'Előregyártott oszlop befogására szolgáló kehely. Ma monolit tömbalapra helyezett kehelynyak.'],
  ['Szalagalap', 'Pillérsort egy irányban összekötő, erősen vasalt talpgerenda.'],
  ['Gerendarács-alap', 'Egymást metsző szalagalapok. Mindkét irányban csökkenti a süllyedéskülönbséget.'],
  ['Lemezalap', 'Az építmény alatt átmenő, összefüggő vasbeton lemez. Falakat és pilléreket is alátámaszt.'],
  ['Rejtettbordás lemez', 'A bordák helyén csak erősítő vasalás van, a vastagság azonos.'],
  ['Ellenfödém', 'Alápincézett épület vasbeton alaplemeze magas talajvíz esetén.'],
  ['Térszíni lemezalap', 'Tömörített szemcsés ágyazatra helyezett vasbeton lemez, alsó síkja a fagyhatár felett maradhat.'],
  ['Dobozalap', 'Az alaplemez, a pincefalak és a födém együttdolgozó, monolit szekrénytartója.'],
  ['Héjalap', 'Görbült felületű lemez, amelyben csak normálerők ébrednek. Ma már nem alkalmazzák.'],
  ['Alapozási sík (alapsík)', 'A síkalap alsó támaszkodó felülete, ahol a terhet az altalajnak átadja.'],
  ['Alapozási mélység', 'Az alapsík és a végleges térszín közötti függőleges távolság.'],
  ['Fagyhatár', 'A télen 0 °C alá hűlő talajréteg legnagyobb vastagsága (hazánkban 0,5–1,0 m).'],
  ['Jéglencse', 'A fagyfronthoz kapillárisan szivárgó vízből növő jégréteg. A fagyemelés fő oka.'],
  ['Kiszáradási határ', 'Az a mélység (kb. 2 m), ameddig a térfogatváltozó agyag évszakosan kiszárad és duzzad.'],
  ['Természetes rézsű', 'Az a hajlás, amellyel a talaj még magától megáll. Részleges pincénél a próbavonal.'],
  ['Alábetonozás', 'A szomszédos régi alap szakaszos alábetonozása, ha az új alapsík mélyebb.'],
  ['Jet-grouting', 'Nagynyomású talajinjektálás, amely talajbeton oszlopot hoz létre. Régi alapok megerősítésére is.'],
  ['Teherbírási határállapot (ULS)', 'Tönkremenetel vagy súlyos károsodás; GEO, STR, EQU, UPL, HYD.'],
  ['Használhatósági határállapot (SLS)', 'Túlzott süllyedés, süllyedéskülönbség, rezgés vagy megemelkedés.'],
  ['GEO', 'A talaj törése vagy túlzott alakváltozása.'],
  ['STR', 'A szerkezeti elemek belső törése vagy túlzott alakváltozása.'],
  ['EQU', 'A helyzeti állékonyság elvesztése merev testként.'],
  ['UPL', 'Felúszás miatti egyensúlyvesztés.'],
  ['Közvetlen tervezési eljárás', 'Minden határállapotra külön számítási modell (törési mechanizmus, süllyedésszámítás).'],
  ['Közvetett tervezési eljárás', 'Tapasztalatok és mérések (pl. szondázás) alapján, tapasztalati képletekkel.'],
  ['Szokáson alapuló eljárás', 'Valószínűsített talajtörési ellenállással, elsősorban kőzetre alapozásnál.'],
  ['Következményosztály (CC)', 'A tönkremenetel következményei szerinti besorolás (CC1–CC4).'],
  ['Geotechnikai kategória', 'Az építmény geotechnikai besorolása (GC1–GC3). Az új EC7-ben a CC és a geotechnikai komplexitás együtt adja.'],
  ['MFA / RFA', 'Anyagtényezős, illetve ellenállástényezős igazolási eljárás az új EC7-ben.'],
  ['Általános nyírási törés', 'A felszínig kifutó csúszólap, felpúposodás, csúcs a teher–süllyedés görbén.'],
  ['Helyi nyírási törés', 'Részlegesen kifejlődő törési felület, nagyobb süllyedés, csúcs nélkül.'],
  ['Benyomódás (befúródás)', 'Törési felület nélküli, nagy süllyedéssel járó tönkremenetel laza vagy puha talajban.'],
  ['Relatív tömörség (Tre)', 'Tre = (emax − e)/(emax − emin). A szemcsés talaj tömörségi állapota.'],
  ['Prandtl-mechanizmus', 'Aktív ék, radiális nyírási zóna és passzív ék – a teherbírási képlet alapja.']
];
