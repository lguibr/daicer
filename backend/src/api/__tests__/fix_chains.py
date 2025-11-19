import sys
import re

def fix_file(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()
    
    fixed = []
    skip_next = False
    for i, line in enumerate(lines):
        if skip_next:
            skip_next = False
            continue
        
        # If current line has .set( and next line is blank and line after has .send(
        if (i < len(lines) - 2 and 
            '.set(' in line and 
            lines[i+1].strip() == '' and 
            '.send(' in lines[i+2]):
            fixed.append(line)
            fixed.append(lines[i+2])  # Skip the blank line
            skip_next = True
            i += 1  # Skip next iteration
        else:
            fixed.append(line)
    
    with open(filename, 'w') as f:
        f.writelines(fixed)

for fname in ['equipment.integration.spec.ts', 'rooms.integration.spec.ts', 'tactical.integration.spec.ts']:
    fix_file(fname)
    print(f"✅ Fixed {fname}")
