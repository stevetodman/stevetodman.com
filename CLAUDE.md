# stevetodman.com

Personal website and tools for Steve Todman, MD - Pediatric Cardiologist

## Deployment

- **Host**: Cloudflare Pages
- **Auto-deploy**: Push to `main` → Cloudflare builds automatically (~30 sec)
- **Domain**: https://stevetodman.com

## Structure

```
stevetodman.com/
├── index.html              # Homepage
├── cooking/                # Cooking timers
│   ├── index.html
│   ├── ribs-timer.html
│   └── ribeye-timer.html
├── tools/                  # Clinical tools
│   ├── index.html
│   ├── bp-percentile.html  # Original (simplified tables)
│   └── bp-percentile-calculator.html  # AAP 2017 validated ⭐
└── .github/workflows/
    └── update-cooking-index.yml  # Auto-updates cooking/index.html
```

## Clinical Tools

### BP Percentile Calculator (AAP 2017)
`tools/bp-percentile-calculator.html`

**Validated implementation** of AAP 2017 pediatric blood pressure percentiles using:
- Rosner quantile regression spline model
- Coefficients from BenSolomon/pediatric-bp GitHub (official source)
- CDC 2000 growth chart LMS parameters for height z-scores

**Accuracy verified against:**
- bsolomon.us calculator: <0.01 mmHg match
- Rosner sample_output.txt: 87.5% exact, 100% within ±1 percentile
- AAP 2017 Table 4 (Merck): 62.5% exact, 100% within ±1 mmHg

**Features:**
- Computes SBP/DBP percentiles for ages 1-17
- Height input: percentile, z-score, or cm
- Classification per AAP 2017 guidelines (Normal, Elevated, Stage 1/2 HTN)
- Collapsible validation panel showing accuracy data

## Workflow

1. Claude generates HTML file
2. User downloads and runs:
   ```bash
   cd ~/Downloads/stevetodman.com
   mv ~/Downloads/[file].html [destination]/
   git add . && git commit -m "Description" && git push
   ```
3. Live in ~30 seconds

## GitHub Actions

- `update-cooking-index.yml`: Automatically regenerates `cooking/index.html` when new timer files are added
