const productionUrl = (process.env.AMAT_PRODUCTION_URL || 'https://amat19.vercel.app').replace(/\/$/, '');
const expectedCommit = process.argv[2] || process.env.GITHUB_SHA;
const expectedRelease = process.env.AMAT_EXPECTED_RELEASE || 'amat19-blueprint-v7';
const attempts = Number(process.env.AMAT_DEPLOY_VERIFY_ATTEMPTS || 60);
const delayMs = Number(process.env.AMAT_DEPLOY_VERIFY_DELAY_MS || 10000);

if (!expectedCommit) {
  console.error('Expected commit SHA is required.');
  process.exit(2);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  const url = `${productionUrl}/version.json?verify=${Date.now()}`;
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
      redirect: 'follow',
    });
    if (response.ok) {
      const version = await response.json();
      const commitMatches = version?.commit === expectedCommit;
      const releaseMatches = version?.release === expectedRelease;
      console.log(`[${attempt}/${attempts}] production commit=${version?.commit ?? 'missing'} release=${version?.release ?? 'missing'}`);
      if (commitMatches && releaseMatches) {
        console.log(`Production verified: ${productionUrl} serves ${expectedCommit} on ${expectedRelease}.`);
        process.exit(0);
      }
    } else {
      console.log(`[${attempt}/${attempts}] version endpoint returned HTTP ${response.status}`);
    }
  } catch (error) {
    console.log(`[${attempt}/${attempts}] production check failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (attempt < attempts) await sleep(delayMs);
}

console.error(`Production verification failed: ${productionUrl} did not serve commit ${expectedCommit} on ${expectedRelease} within the verification window.`);
process.exit(1);
