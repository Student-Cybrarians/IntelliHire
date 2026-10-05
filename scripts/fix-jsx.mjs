import fs from 'fs';

const filePath = 'src/client/pages/AssessmentV2.tsx';
let code = fs.readFileSync(filePath, 'utf-8');

const brokenStr = `                      </div>
                    </div>
                  </div>
                  </div>
                ) : (`;

const fixedStr = `                      </div>
                    </div>
                  </div>
                ) : (`;

if (code.includes(brokenStr)) {
  code = code.replace(brokenStr, fixedStr);
  fs.writeFileSync(filePath, code, 'utf-8');
  console.log("Fixed JSX syntax.");
} else {
  console.log("Could not find broken string.");
}
