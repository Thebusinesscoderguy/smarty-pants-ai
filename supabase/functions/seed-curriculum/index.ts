import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const frameworks = [
    ["saudi_moe","Saudi MOE","المناهج السعودية","gcc","Saudi Ministry of Education, Grades 1-12"],
    ["uae_moe","UAE MOE","المناهج الإماراتية","gcc","UAE Ministry of Education, Grades 1-12"],
    ["kuwait_moe","Kuwait MOE","المناهج الكويتية","gcc","Kuwait Ministry of Education, Grades 1-12"],
    ["qatar_moe","Qatar MOE","المناهج القطرية","gcc","Qatar Ministry of Education, Grades 1-12"],
    ["cambridge_igcse","Cambridge IGCSE","كامبريدج IGCSE","global","Cambridge IGCSE, Years 10-11"],
    ["cambridge_alevel","Cambridge A-Level","كامبريدج A-Level","global","Cambridge A-Level, Years 12-13"],
    ["cambridge_primary","Cambridge Primary","كامبريدج ابتدائي","global","Cambridge Primary, Stages 1-6"],
    ["cambridge_lower","Cambridge Lower Secondary","كامبريدج إعدادي","global","Cambridge Lower Secondary, Stages 7-9"],
    ["ib_myp","IB Middle Years Programme","البكالوريا الدولية MYP","global","IB MYP, Years 1-5"],
    ["ib_dp","IB Diploma Programme","البكالوريا الدولية DP","global","IB DP, Years 1-2"],
    ["us_common_core","US Common Core","المنهج الأمريكي","us","US Common Core, Grades K-12"],
    ["uk_national","UK National Curriculum","المنهج البريطاني","uk","England National Curriculum, Years 1-13"],
  ].map(([code, name_en, name_ar, region, description]) => ({ code, name_en, name_ar, region, description }));

  await supabase.from("curriculum_frameworks").upsert(frameworks, { onConflict: "code" });

  const { data: fws } = await supabase.from("curriculum_frameworks").select("id, code");
  const fwMap: Record<string, string> = Object.fromEntries((fws ?? []).map((f: any) => [f.code, f.id]));

  const arabicGrades = ["الصف الأول","الصف الثاني","الصف الثالث","الصف الرابع","الصف الخامس","الصف السادس","الصف السابع","الصف الثامن","الصف التاسع","الصف العاشر","الصف الحادي عشر","الصف الثاني عشر"];
  const moeGrades = Array.from({ length: 12 }, (_, i) => [`Grade ${i + 1}`, arabicGrades[i], i + 1] as const);

  const grades: Record<string, ReadonlyArray<readonly [string, string, number]>> = {
    cambridge_igcse: [["Year 10","السنة العاشرة",1],["Year 11","السنة الحادية عشرة",2]],
    cambridge_alevel: [["AS Level (Year 12)","السنة الثانية عشرة",1],["A2 Level (Year 13)","السنة الثالثة عشرة",2]],
    ib_myp: [["MYP Year 1","السنة الأولى MYP",1],["MYP Year 2","السنة الثانية MYP",2],["MYP Year 3","السنة الثالثة MYP",3],["MYP Year 4","السنة الرابعة MYP",4],["MYP Year 5","السنة الخامسة MYP",5]],
    ib_dp: [["DP Year 1 (Grade 11)","السنة الأولى DP",1],["DP Year 2 (Grade 12)","السنة الثانية DP",2]],
    us_common_core: [["Kindergarten","روضة الأطفال",0],["Grade 1","الصف الأول",1],["Grade 2","الصف الثاني",2],["Grade 3","الصف الثالث",3],["Grade 4","الصف الرابع",4],["Grade 5","الصف الخامس",5],["Grade 6","الصف السادس",6],["Grade 7","الصف السابع",7],["Grade 8","الصف الثامن",8],["Grade 9-10","الصفان التاسع والعاشر",9],["Grade 11-12","الصفان الحادي عشر والثاني عشر",11]],
    uk_national: [["Year 1","السنة الأولى",1],["Year 2","السنة الثانية",2],["Year 3","السنة الثالثة",3],["Year 4","السنة الرابعة",4],["Year 5","السنة الخامسة",5],["Year 6","السنة السادسة",6],["Year 7","السنة السابعة",7],["Year 8","السنة الثامنة",8],["Year 9","السنة التاسعة",9],["Year 10 (GCSE)","السنة العاشرة GCSE",10],["Year 11 (GCSE)","السنة الحادية عشرة GCSE",11],["Year 12 (A-Level)","السنة الثانية عشرة",12],["Year 13 (A-Level)","السنة الثالثة عشرة",13]],
    saudi_moe: moeGrades,
    uae_moe: moeGrades,
    kuwait_moe: moeGrades,
    qatar_moe: moeGrades,
    cambridge_primary: [["Stage 1","المرحلة الأولى",1],["Stage 2","المرحلة الثانية",2],["Stage 3","المرحلة الثالثة",3],["Stage 4","المرحلة الرابعة",4],["Stage 5","المرحلة الخامسة",5],["Stage 6","المرحلة السادسة",6]],
    cambridge_lower: [["Stage 7","المرحلة السابعة",7],["Stage 8","المرحلة الثامنة",8],["Stage 9","المرحلة التاسعة",9]],
  };

  const subjects: Record<string, ReadonlyArray<readonly [string, string, string | null]>> = {
    cambridge_igcse: [["Mathematics (0580)","الرياضيات","0580"],["Physics (0625)","الفيزياء","0625"],["Chemistry (0620)","الكيمياء","0620"],["Biology (0610)","الأحياء","0610"],["English Language (0500)","اللغة الإنجليزية","0500"],["Computer Science (0478)","علوم الحاسوب","0478"],["Economics (0455)","الاقتصاد","0455"],["Arabic (0508)","اللغة العربية","0508"]],
    cambridge_alevel: [["Mathematics (9709)","الرياضيات","9709"],["Physics (9702)","الفيزياء","9702"],["Chemistry (9701)","الكيمياء","9701"],["Biology (9700)","الأحياء","9700"],["Computer Science (9618)","علوم الحاسوب","9618"],["Economics (9708)","الاقتصاد","9708"]],
    ib_myp: [["Mathematics","الرياضيات",null],["Sciences","العلوم",null],["Language & Literature","اللغة والأدب",null],["Individuals & Societies","الأفراد والمجتمعات",null],["Design","التصميم",null],["Arts","الفنون",null]],
    ib_dp: [["Mathematics: Analysis & Approaches","الرياضيات: التحليل والمقاربات",null],["Mathematics: Applications & Interpretation","الرياضيات: التطبيقات والتفسير",null],["Physics","الفيزياء",null],["Chemistry","الكيمياء",null],["Biology","الأحياء",null],["Computer Science","علوم الحاسوب",null],["Economics","الاقتصاد",null],["English A","اللغة الإنجليزية",null],["Arabic A","اللغة العربية",null]],
    us_common_core: [["Mathematics","الرياضيات",null],["English Language Arts","فنون اللغة الإنجليزية",null],["Science (NGSS)","العلوم",null],["Social Studies","الدراسات الاجتماعية",null]],
    uk_national: [["Mathematics","الرياضيات",null],["English","الإنجليزية",null],["Science","العلوم",null],["Physics","الفيزياء",null],["Chemistry","الكيمياء",null],["Biology","الأحياء",null],["Computer Science","علوم الحاسوب",null],["History","التاريخ",null],["Geography","الجغرافيا",null]],
    saudi_moe: [["Mathematics","الرياضيات",null],["Arabic Language","اللغة العربية",null],["English Language","اللغة الإنجليزية",null],["Physics","الفيزياء",null],["Chemistry","الكيمياء",null],["Biology","الأحياء",null],["Islamic Studies","التربية الإسلامية",null],["Social Studies","الدراسات الاجتماعية",null],["Computer Science","الحاسب الآلي",null]],
    uae_moe: [["Mathematics","الرياضيات",null],["Arabic Language","اللغة العربية",null],["English Language","اللغة الإنجليزية",null],["Physics","الفيزياء",null],["Chemistry","الكيمياء",null],["Biology","الأحياء",null],["Islamic Studies","التربية الإسلامية",null],["ICT","تقنية المعلومات",null]],
    kuwait_moe: [["Mathematics","الرياضيات",null],["Arabic Language","اللغة العربية",null],["English Language","اللغة الإنجليزية",null],["Physics","الفيزياء",null],["Chemistry","الكيمياء",null],["Biology","الأحياء",null],["Islamic Studies","التربية الإسلامية",null]],
    qatar_moe: [["Mathematics","الرياضيات",null],["Arabic Language","اللغة العربية",null],["English Language","اللغة الإنجليزية",null],["Physics","الفيزياء",null],["Chemistry","الكيمياء",null],["Biology","الأحياء",null],["Islamic Studies","التربية الإسلامية",null]],
    cambridge_primary: [["Mathematics","الرياضيات",null],["English","الإنجليزية",null],["Science","العلوم",null],["Digital Literacy","محو الأمية الرقمية",null]],
    cambridge_lower: [["Mathematics","الرياضيات",null],["English","الإنجليزية",null],["Science","العلوم",null],["Digital Literacy","محو الأمية الرقمية",null]],
  };

  const allGrades: any[] = [];
  for (const [code, arr] of Object.entries(grades)) {
    const fid = fwMap[code]; if (!fid) continue;
    for (const [label_en, label_ar, sort_order] of arr) allGrades.push({ framework_id: fid, label_en, label_ar, sort_order });
  }
  const gradeRes = await supabase.from("curriculum_grade_levels").upsert(allGrades, { onConflict: "framework_id,sort_order", ignoreDuplicates: true });

  const allSubs: any[] = [];
  for (const [code, arr] of Object.entries(subjects)) {
    const fid = fwMap[code]; if (!fid) continue;
    for (const [name_en, name_ar, c] of arr) allSubs.push({ framework_id: fid, name_en, name_ar, code: c });
  }
  const subRes = await supabase.from("curriculum_subjects").upsert(allSubs, { onConflict: "framework_id,name_en", ignoreDuplicates: true });

  const [{ count: fc }, { count: gc }, { count: sc }] = await Promise.all([
    supabase.from("curriculum_frameworks").select("*", { count: "exact", head: true }),
    supabase.from("curriculum_grade_levels").select("*", { count: "exact", head: true }),
    supabase.from("curriculum_subjects").select("*", { count: "exact", head: true }),
  ]);

  return new Response(JSON.stringify({
    frameworks: fc, gradeLevels: gc, subjects: sc,
    gradeError: gradeRes.error?.message, subjectError: subRes.error?.message,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
