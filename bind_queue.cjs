const fs = require('fs');
const jsonc = fs.readFileSync('wrangler.jsonc', 'utf8');

// Insert queue producer binding if not present
if (!jsonc.includes('"queues"')) {
  const newJsonc = jsonc.replace(
    /"ai": \{/,
    `"queues": {
    "producers": [
      {
        "binding": "M1_JOBS",
        "queue": "m1-jobs-queue"
      }
    ]
  },
  "ai": {`
  );
  fs.writeFileSync('wrangler.jsonc', newJsonc);
}
