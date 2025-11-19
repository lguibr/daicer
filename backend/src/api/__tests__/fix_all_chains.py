import re

def fix_file(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()
    
    fixed = []
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # If current line ends with a method call like .set( or .post( or .patch(
        # and next line is blank, and line after continues the chain
        if (i < len(lines) - 2 and 
            re.search(r'\.(set|post|patch|put|delete|get)\(', line) and 
            lines[i+1].strip() == '' and 
            re.search(r'^\s*\.(send|expect|set)', lines[i+2])):
            fixed.append(line)
            # Skip blank line, add the continuation
            fixed.append(lines[i+2])
            i += 3  # Skip all 3 lines
        else:
            fixed.append(line)
            i += 1
    
    with open(filename, 'w') as f:
        f.writelines(fixed)

for fname in ['equipment.integration.spec.ts', 'rooms.integration.spec.ts', 'tactical.integration.spec.ts']:
    fix_file(fname)
    print(f"✅ Fixed {fname}")
