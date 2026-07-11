import pdfplumber
import re
import json

WATERMARK_CHARS = set('基公讲叔凯')

def clean_text(text):
    """Remove watermark lines and footer noise"""
    if not text:
        return ""
    lines = []
    for line in text.split('\n'):
        stripped = line.strip()
        if not stripped:
            continue
        if all(c in WATERMARK_CHARS or c.isspace() for c in stripped) and len(stripped) <= 5:
            continue
        lines.append(line)
    result = '\n'.join(lines)
    result = re.sub(r'本课程仅限本人使用[^\n]*', '', result)
    result = re.sub(r'本课程由[^\n]*', '', result)
    result = re.sub(r'详情咨询[^\n]*', '', result)
    result = re.sub(r'\n\s*\d{1,2}\s*\n', '\n', result)
    return result.strip()

def read_pdf(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        parts = []
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                parts.append(t)
        return clean_text('\n'.join(parts))

def find_sections(text, subject_type):
    """Split text into sections based on subject type.
    Returns list of (section_name, section_text)"""
    sections = []
    
    if subject_type == '马哲新思想':
        # Split by 刷题 markers
        pattern = r'(马哲[、，]?\s*新思想\s*刷题[一二三四五六七八])'
        parts = re.split(pattern, text)
        i = 1
        while i < len(parts) - 1:
            if re.match(r'马哲', parts[i]):
                sections.append((parts[i].strip(), parts[i+1]))
                i += 2
            else:
                i += 1
    
    elif subject_type == '经济科技文史':
        pattern = r'(经济科技文史\s*练习[一二三四五六七八])'
        parts = re.split(pattern, text)
        i = 1
        while i < len(parts) - 1:
            if re.match(r'经济科技文史', parts[i]):
                sections.append((parts[i].strip(), parts[i+1]))
                i += 2
            else:
                i += 1
    
    elif subject_type == '法律管理公文':
        # 法律练习, 公文练习, 管理练习
        pattern = r'((?:法律|公文|管理)\s*练习)'
        parts = re.split(pattern, text)
        i = 1
        while i < len(parts) - 1:
            if re.match(r'(法律|公文|管理)', parts[i]):
                # Filter out "法律练习答案解析" -> normalize to "法律练习"
                name = re.sub(r'答案解析', '', parts[i]).strip()
                sections.append((name, parts[i+1]))
                i += 2
            else:
                i += 1
    
    return sections

def extract_questions_from_section(text):
    """Extract questions from a section, categorized by type"""
    questions = []
    
    # Split by type headers
    type_pattern = r'([一二三四五六七八])[、.](单选题|多选题|判断题|改错题)'
    type_parts = re.split(type_pattern, text)
    
    current_type = "单选题"
    
    j = 0
    while j < len(type_parts):
        if type_parts[j] in ('单选题', '多选题', '判断题', '改错题'):
            current_type = type_parts[j]
            content = type_parts[j+1] if j+1 < len(type_parts) else ""
            j += 2
        else:
            content = type_parts[j]
            j += 1
        
        if not content.strip():
            continue
        
        # Extract numbered items
        items = extract_numbered_items(content, current_type)
        questions.extend(items)
    
    # If no type headers found, treat everything as 单选题
    if not questions:
        questions = extract_numbered_items(text, '单选题')
    
    return questions

def extract_numbered_items(text, qtype):
    """Extract numbered items from text"""
    items = []
    # Questions start with number at beginning of line followed by . or 、
    # Prepend newline to catch first item
    parts = re.split(r'\n(\d{1,3})[.、]', '\n' + text)
    
    i = 1
    while i < len(parts) - 1:
        try:
            num_str = parts[i].strip()
            content = parts[i+1].strip() if i+1 < len(parts) else ""
            
            if re.match(r'^\d{1,3}$', num_str) and len(content) > 3:
                content = re.sub(r'\n+', '\n', content).strip()
                content = re.sub(r'\n\s*\d{1,2}\s*$', '', content)
                
                items.append({
                    'number': int(num_str),
                    'type': qtype,
                    'content': content
                })
            i += 2
        except:
            i += 2
    
    return items

def extract_answers_from_section(text):
    """Extract answers from a section"""
    answers = []
    
    # Match pattern: N.【答案】X。解析：...
    # Some answers don't have 解析
    pattern = r'(\d{1,3})\.【答案】([A-D]+)(.*?)(?=\n\d{1,3}\.【答案】|\n(?:[一二三四五六七八])[、.]|\Z)'
    
    for m in re.finditer(pattern, text, re.DOTALL):
        num = m.group(1)
        ans = m.group(2)
        exp_raw = m.group(3).strip()
        
        # Clean explanation
        exp_raw = re.sub(r'^[。，,\.]?\s*', '', exp_raw)
        exp_raw = re.sub(r'解析[：:]', '', exp_raw).strip()
        exp_raw = re.sub(r'\n\s*\d{1,2}\s*$', '', exp_raw)
        exp_raw = re.sub(r'\n+', '\n', exp_raw).strip()
        
        answers.append({
            'number': int(num),
            'answer': ans,
            'explanation': exp_raw
        })
    
    return answers

def process_subject(subject):
    """Process one subject: read PDFs, extract, match"""
    q_text = read_pdf(subject['question_pdf'])
    a_text = read_pdf(subject['answer_pdf'])
    
    q_sections = find_sections(q_text, subject['category'])
    a_sections = find_sections(a_text, subject['category'])
    
    print(f"  Question sections: {[s[0] for s in q_sections]}")
    print(f"  Answer sections:   {[s[0] for s in a_sections]}")
    
    # Build lookup for answer sections
    a_sec_map = {}
    for name, txt in a_sections:
        # Normalize names for matching
        key = name.replace(' ', '').replace('、', '').replace('，', '')
        a_sec_map[key] = extract_answers_from_section(txt)
    
    all_matched = []
    
    for sec_name, sec_text in q_sections:
        questions = extract_questions_from_section(sec_text)
        print(f"    {sec_name}: {len(questions)} questions")
        
        # Find matching answer section
        key = sec_name.replace(' ', '').replace('、', '').replace('，', '')
        ans_list = a_sec_map.get(key, [])
        
        if not ans_list:
            # Try partial match
            for ak, av in a_sec_map.items():
                if key in ak or ak in key:
                    ans_list = av
                    break
        
        ans_dict = {a['number']: a for a in ans_list}
        
        for q in questions:
            ans = ans_dict.get(q['number'])
            matched = {
                'id': f"{subject['category']}_{sec_name}_{q['number']}",
                'category': subject['category'],
                'section': sec_name.strip(),
                'number': q['number'],
                'type': q['type'],
                'question': q['content'],
                'answer': ans['answer'] if ans else '',
                'explanation': ans['explanation'] if ans else ''
            }
            all_matched.append(matched)
    
    return all_matched

# ===== MAIN =====
subjects = [
    {
        'category': '马哲新思想',
        'question_pdf': '/Users/zw/Downloads/2.2026年【基础班】马哲 新思想练习（2套）题本.pdf',
        'answer_pdf': '/Users/zw/Downloads/3.2026年【基础班】马哲 新思想练习（2套）答案解析.pdf'
    },
    {
        'category': '经济科技文史',
        'question_pdf': '/Users/zw/Downloads/9.2026年【基础班】经济科技文史练习（2套）题本（11.19）.pdf',
        'answer_pdf': '/Users/zw/Downloads/10. 2026年【基础班】经济科技文史练习（2套）答案解析.pdf'
    },
    {
        'category': '法律管理公文',
        'question_pdf': '/Users/zw/Downloads/12.2026年【基础班】法律管理公文练习（2套） 题本（12.2）.pdf',
        'answer_pdf': '/Users/zw/Downloads/13.2026年【基础班】法律练习 答案解析（12.3）.pdf'
    }
]

all_data = []
for subj in subjects:
    print(f"\n{'='*60}")
    print(f"Processing: {subj['category']}")
    print(f"{'='*60}")
    matched = process_subject(subj)
    all_data.extend(matched)
    print(f"  Total matched: {len(matched)}")

print(f"\n{'='*60}")
print(f"GRAND TOTAL: {len(all_data)} questions")
print(f"{'='*60}")

# Stats
for cat in ['马哲新思想', '经济科技文史', '法律管理公文']:
    items = [x for x in all_data if x['category'] == cat]
    with_ans = sum(1 for x in items if x['answer'])
    types = {}
    for x in items:
        types[x['type']] = types.get(x['type'], 0) + 1
    sections = set(x['section'] for x in items)
    print(f"  {cat}: {len(items)} total, {with_ans} with answers")
    print(f"    Sections: {sections}")
    print(f"    Types: {types}")

# Show a few samples to verify
print(f"\n{'='*60}")
print("Sample verification:")
print(f"{'='*60}")
for cat in ['马哲新思想', '经济科技文史', '法律管理公文']:
    items = [x for x in all_data if x['category'] == cat]
    if items:
        item = items[0]
        print(f"\n  [{cat}] {item['section']} Q{item['number']} ({item['type']})")
        print(f"  Q: {item['question'][:100]}...")
        print(f"  A: {item['answer']}")
        print(f"  E: {item['explanation'][:100]}...")

output_path = '/Users/zw/Downloads/codex/01/questions.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(all_data, f, ensure_ascii=False, indent=2)
print(f"\nSaved to {output_path}")
