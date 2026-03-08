#!/bin/bash
# プロンプトのログを prompts.md に記録するフック

PROMPT_FILE="$(pwd)/prompts.md"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# stdin から JSON を読み込み、prompt フィールドを抽出
PROMPT=$(cat | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data.get('prompt', ''))
")

# prompts.md に追記
cat >> "$PROMPT_FILE" <<EOF

## $TIMESTAMP

$PROMPT

---
EOF

exit 0