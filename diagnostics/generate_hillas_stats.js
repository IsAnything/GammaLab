const fs = require('fs');
const path = require('path');
const vm = require('vm');

function readSource(relPath) {
  const p = path.resolve(__dirname, '..', relPath);
  return fs.readFileSync(p, 'utf8');
}

function stats(arr) {
  const n = arr.length;
  if (n === 0) return null;
  const mean = arr.reduce((s, v) => s + v, 0) / n;
  const variance = arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
  return { n, mean, std: Math.sqrt(variance) };
}

async function run({ events = 500 } = {}) {
  // Load sources into a fresh VM so browser globals are not required
  const coreSrc = readSource('js/core-simulation.js');
  const profilesSrc = readSource('js/source-profiles.js');
  const hillasSrc = readSource('js/hillas-analysis.js');

  const context = {
    console: console,
    Math: Math,
    Date: Date,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
  };

  vm.createContext(context);

  // Execute files in the VM in an order that satisfies dependencies
  vm.runInContext(coreSrc, context, { filename: 'core-simulation.js' });
  vm.runInContext(profilesSrc, context, { filename: 'source-profiles.js' });
  vm.runInContext(hillasSrc, context, { filename: 'hillas-analysis.js' });

  // Instantiate objects from the VM
  const SimulationEngine = context.SimulationEngine;
  const getSourceProfile = context.getSourceProfile;
  const HillasAnalyzer = context.HillasAnalyzer;

  if (!SimulationEngine || !getSourceProfile || !HillasAnalyzer) {
    console.error('Required classes/functions not available in VM context');
    process.exit(1);
  }

  const engine = new SimulationEngine();
  const analyzer = new HillasAnalyzer();
  const profile = getSourceProfile('crab');

  const length_px = [];
  const width_px = [];
  const length_deg = [];
  const width_deg = [];
  const size_pe = [];
  const elong = [];
  const alpha = [];
  const numPhotons = [];

  let validCount = 0;

  for (let i = 0; i < events; i++) {
    const ev = engine.generateEvent(profile, 1, null, null);
    const res = analyzer.analyze(ev);
    if (!res || !res.valid) continue;
    validCount++;
    length_px.push(res.lengthPx);
    width_px.push(res.widthPx);
    length_deg.push(res.length);
    width_deg.push(res.width);
    size_pe.push(res.size);
    elong.push(res.elongation);
    alpha.push(res.alpha);
    numPhotons.push(res.numPhotons);
  }

  const out = {
    requestedEvents: events,
    validEvents: validCount,
    length_px: stats(length_px),
    width_px: stats(width_px),
    length_deg: stats(length_deg),
    width_deg: stats(width_deg),
    size_pe: stats(size_pe),
    elongation: stats(elong),
    alpha: stats(alpha),
    numPhotons: stats(numPhotons)
  };

  console.log('\n=== Hillas diagnostics (Crab) ===');
  console.log(JSON.stringify(out, null, 2));

  // Recommend dx/dy multipliers to move length/width to targets
  const target_length_px = 25; // target from docs
  const target_width_px = 8;

  if (out.length_px && out.length_px.mean > 0) {
    const curr_dx_multiplier = 2.5;
    const suggested_dx = curr_dx_multiplier * (target_length_px / out.length_px.mean);
    console.log('\nSuggested dx multiplier (was ' + curr_dx_multiplier + '):', suggested_dx.toFixed(3));
  }

  if (out.width_px && out.width_px.mean > 0) {
    const curr_dy_multiplier = 0.3;
    const suggested_dy = curr_dy_multiplier * (target_width_px / out.width_px.mean);
    console.log('Suggested dy multiplier (was ' + curr_dy_multiplier + '):', suggested_dy.toFixed(3));
  }

  console.log('\nDone.');
}

// CLI (lightweight arg parsing, avoids external deps)
function parseArgs() {
  const out = {};
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--events' || a === '-n') {
      const v = args[i + 1];
      if (v) { out.events = parseInt(v, 10); i++; }
    } else if (a.startsWith('--events=')) {
      out.events = parseInt(a.split('=')[1], 10);
    }
  }
  return out;
}

const cli = parseArgs();
const events = (cli.events && Number.isFinite(cli.events)) ? cli.events : 500;

run({ events }).catch(err => {
  console.error('Error running diagnostics:', err);
  process.exit(1);
});
