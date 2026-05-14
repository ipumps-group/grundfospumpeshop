/**
 * spec-sections.ts
 * Maps product attribute names to display sections,
 * matching Grundfos's own grouping (Tehnilised, Elektriandmed, etc.)
 */

export interface SpecSection {
  key: string
  label: string
  patterns: RegExp[]
}

export const SPEC_SECTIONS: SpecSection[] = [
  {
    key: 'tehniline',
    label: 'Tehnilised',
    patterns: [
      /nimijõudlus/i,
      /jooksev.*vooluhulk/i,
      /pumba.*kiirus/i,
      /pump speed/i,
      /pumba lõppsurve/i,
      /tõstekõrgus/i,
      /töörattad/i,
      /number of.*impeller/i,
      /võllitihendi kood/i,
      /code for shaft seal/i,
      /tunnustused/i,
      /^approvals/i,
      /karakt.*tolerants/i,
      /^mudel$/i,
      /tagastusklapp/i,
      /käivitusrõhk/i,
      /pumba kood/i,
      /pumba versioon/i,
      /^mootor$/i,
      /^motor$/i,
      /kiirus nr/i,
      /nimikiirus/i,
      /maks.*pumba kiirus/i,
      /rated speed/i,
      /maximum speed/i,
      /pumpade arv/i,
      /astmeid/i,
      /nivoolüliti/i,
      /float switch/i,
      /flow switch/i,
      /^lüliti$/i,
      /presscontrol/i,
      /^ventiil$/i,
      /^strainer$/i,
      /paigaldus.*kuiv/i,
      /place of installation/i,
      /pump head orientation/i,
      /auto coupling/i,
      /type of impeller/i,
      /max voolukiirus/i,
      /operation mode/i,
    ],
  },
  {
    key: 'elektri',
    label: 'Elektriandmed',
    patterns: [
      /nimivõimsus/i,
      /rated power/i,
      /nimipinge/i,
      /nimivool/i,
      /maximum current/i,
      /minimum current/i,
      /maksimaalne voolutarve/i,
      /vooluvõrgu sagedus/i,
      /kaitseklass/i,
      /isolatsiooniklass/i,
      /insulation class/i,
      /^kaabel$/i,
      /kaabli pikkus/i,
      /length of.*cable/i,
      /kaabli tüüp/i,
      /power cable type/i,
      /kaablipistiku/i,
      /power plug/i,
      /sagedusmuundur/i,
      /tarbitav võimsus/i,
      /power input/i,
      /sisendvõimsus/i,
      /p1 maks/i,
      /p1 min/i,
      /maks.*tarbitav võimsus/i,
      /min.*tarbitav võimsus/i,
      /cos f?ii/i,
      /cos phi/i,
      /võimsustegur/i,
      /kondensaator/i,
      /^tf klass/i,
      /käivitusviis/i,
      /käivitusvool/i,
      /mähised/i,
      /^windings/i,
      /pooluspaaride arv/i,
      /energia.*eei/i,
      /minimum efficiency index/i,
      /sisse-ehitatud mootorikaitse/i,
      /thermal protection/i,
      /^termokaitse$/i,
      /vool \d\./i,
      /tarbitav võimsus \d\./i,
      /toitepistmik/i,
      /type of connector/i,
      /juhtimisseade/i,
      /juhtmete arv/i,
    ],
  },
  {
    key: 'materjalid',
    label: 'Materjalid',
    patterns: [
      /pumbapesa/i,
      /pump housing/i,
      /^tööratas$/i,
      /võllitihend/i,
      /^võll$/i,
      /primaartihend/i,
      /kummiosade kood/i,
      /type key.*rubber/i,
      /type key.*materials/i,
      /materjali kood/i,
      /mootori kood/i,
      /mootori tüüp/i,
      /mootori versioon/i,
      /motor type/i,
      /motor version/i,
      /motor house/i,
      /motor flange/i,
      /motor diameter/i,
      /ph-vahemik/i,
    ],
  },
  {
    key: 'paigaldamine',
    label: 'Paigaldamine',
    patterns: [
      /maksimaalne keskkonna temperatuur/i,
      /ümbritseva temperat/i,
      /minimum ambient temperature/i,
      /maximum ambient pressure/i,
      /maks.*töösurve/i,
      /maximum permissible inlet/i,
      /maximum outlet pressure/i,
      /pipe connection standard/i,
      /type of inlet connection/i,
      /type of outlet connection/i,
      /type of connection/i,
      /size of inlet/i,
      /size of outlet/i,
      /^size of connection/i,
      /pressure rating for connection/i,
      /imiava mõõt/i,
      /pumba imiava/i,
      /pumba surveava/i,
      /surveava mõõt/i,
      /paigalduspikkus/i,
      /port-to-port/i,
      /specification for shaft end/i,
      /kiirliitmik/i,
      /terminal box/i,
      /minimaalne manteltoru/i,
      /minimum borehole/i,
      /maximum installation depth/i,
      /maks.*vedeliku temp.*0.15/i,
      /hooldustegur/i,
      /keskond.*maks/i,
      /cable union/i,
      /cable number/i,
    ],
  },
  {
    key: 'vedelik',
    label: 'Vedelik',
    patterns: [
      /pumbatav vedelik/i,
      /vedeliku temperatuurivahemik/i,
      /valitud vedeliku temperatuur/i,
      /^tihedus$/i,
      /maks\.?tahkis/i,
      /^pump$/i,
    ],
  },
  {
    key: 'juhtimine',
    label: 'Juhtimine',
    patterns: [
      /cu 300/i,
      /autom.*öörežiim/i,
      /main pump product/i,
      /main pump type/i,
      /sisseehit.*temp.*transmitter/i,
    ],
  },
  {
    key: 'paak',
    label: 'Paak',
    patterns: [
      /^paak$/i,
      /tank volume/i,
    ],
  },
  {
    key: 'muu',
    label: 'Muu',
    patterns: [
      /.*/,   // catch-all — always last
    ],
  },
]

/** Assign a section key to an attribute name */
export function getSectionKey(attrName: string): string {
  for (const section of SPEC_SECTIONS) {
    if (section.patterns.some(p => p.test(attrName))) {
      return section.key
    }
  }
  return 'muu'
}

/** Group an array of attributes into sections, preserving section order */
export function groupBySection(
  attrs: Array<{ attribute_name: string; attribute_value: string }>
): Array<{ section: SpecSection; attrs: typeof attrs }> {
  const map = new Map<string, typeof attrs>()

  for (const a of attrs) {
    const key = getSectionKey(a.attribute_name)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(a)
  }

  return SPEC_SECTIONS
    .filter(s => map.has(s.key))
    .map(s => ({ section: s, attrs: map.get(s.key)! }))
}
