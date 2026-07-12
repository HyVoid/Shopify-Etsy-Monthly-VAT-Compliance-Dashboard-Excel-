# Calculate Monthly VAT Across Shopify + Etsy with a Reusable Compliance Workbook

![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)
![Platform: Browser + Excel](https://img.shields.io/badge/Platform-Browser%20%2B%20Excel-green.svg)
![Tool Type: VAT Compliance & Decision Support](https://img.shields.io/badge/Tool-VAT%20Decision%20Support-orange.svg)

**Calculate, validate, and prepare monthly multi-country VAT filings from Shopify and Etsy data in minutes — using a free browser version or a reusable Excel workbook, with no installation and no subscription required.**

> ## **No signup. No installation. Free.**
>
> 🌐 **Open in Browser** → [*HTML live demo*](https://hyvoid.github.io/Shopify-Etsy-Monthly-VAT-Compliance-Dashboard-Excel-/)
>
> 📥 **Download Excel** → [*download link*](https://alexhasgreatestuff.gumroad.com/l/ytjhap)
>
> Available in both **browser-based HTML** and **Excel workbook** formats.

---

## Screenshots

<img width="1672" height="941" alt="ChatGPT Image Jul 12, 2026, 08_15_16 PM" src="https://github.com/user-attachments/assets/3a9cb51b-00e5-40a5-81c4-31b15fe2c343" />


*Operational workbook showing raw imports, VAT calculation engine, exception controls, and filing output sheets.*

---

## What It Helps You Track

* Monthly VAT payable by country across Shopify and Etsy in a single reporting view.
* Gross sales, net sales, output VAT, refund VAT, and final tax liabilities simultaneously.
* Transactions containing missing country mappings, incorrect tax assumptions, or reporting inconsistencies.
* Platform-collected tax amounts versus internally calculated VAT obligations.
* Refund-driven VAT recoveries that would otherwise be omitted from filings.
* Filing readiness status before submitting VAT returns or OSS declarations.

---

# Why I Built This

Most small and mid-sized cross-border ecommerce businesses do not struggle because VAT rules are impossible to understand.

They struggle because VAT calculations become fragmented across platforms, exports, accountants, marketplaces, and countries.

A typical monthly workflow often looks like this:

* Export Shopify orders.
* Export Etsy transactions.
* Copy data into separate spreadsheets.
* Calculate VAT manually.
* Compare platform tax values against accounting assumptions.
* Discover exceptions during filing preparation.

The actual analytical failure is not "incorrect tax formulas."

The failure is **making tax decisions without a unified transaction-level model of tax liability**.

For example:

| Scenario              | Traditional Workflow |
| --------------------- | -------------------- |
| Germany sales         | €42,800              |
| Assumed VAT           | 19%                  |
| Shopify collected tax | €6,750               |
| Actual calculated VAT | €6,832               |
| Difference            | €82                  |

An €82 discrepancy may appear immaterial.

However, when repeated across four countries, two platforms, refunds, and multiple filing periods, the issue becomes a reconciliation problem rather than a calculation problem.

This workbook productizes a repeatable analytical framework:

> **Import once → normalize once → validate once → generate filing outputs repeatedly.**

Instead of building another custom spreadsheet every month, the same reasoning framework becomes reusable.

The objective is not automation for its own sake.

The objective is knowing:

> **"Can this month's VAT filing be submitted with confidence?"**

---

## Common VAT Compliance Problems This Solves

| Problem                                  | Without This Tool                      | With This Tool                              |
| ---------------------------------------- | -------------------------------------- | ------------------------------------------- |
| Multi-platform transaction fragmentation | Shopify and Etsy reconciled separately | Unified transaction ledger                  |
| Missing country tax mappings             | Filing errors discovered late          | Missing jurisdictions automatically flagged |
| Platform tax discrepancies               | Manual reconciliation required         | Automated variance detection                |
| Refund VAT treatment                     | Refund tax recovery often omitted      | Refund VAT automatically calculated         |
| Monthly filing preparation               | Rebuilt manually every reporting cycle | Filing output generated automatically       |
| Compliance validation                    | Dependent on manual review             | Systematic exception control                |

---

## Who This Is For

This tool is designed for:

* Shopify merchants selling internationally.
* Etsy sellers with VAT reporting obligations.
* Ecommerce finance managers.
* Fractional CFOs and bookkeepers.
* VAT consultants managing multiple clients.
* Cross-border apparel and consumer product brands.

This tool is **not** designed for:

* ERP replacement projects.
* Enterprise tax engines.
* Automated tax filing gateways.
* Real-time transactional tax calculation APIs.

No spreadsheet expertise is required.

Open the browser version or paste exports into Excel and begin monthly VAT reconciliation immediately.

---

## About

I build lightweight operational trackers and decision-support tools for situations where there are simply too many moving parts to keep reliably in your head.

The question I try to answer is always:

> **"What information needs to exist in one place so that the next decision can be made confidently?"**

This VAT compliance workbook is one example of that approach: turning a recurring analytical process into a reusable decision framework rather than another disposable spreadsheet.

---

## Technical Details

<details>
<summary>For technical reviewers, Excel practitioners, and collaborators</summary>

---

### Workbook Architecture

The workbook follows a four-layer analytical architecture:

```text
DATA INPUT
    ↓
NORMALIZATION ENGINE
    ↓
VAT CALCULATION ENGINE
    ↓
VALIDATION CENTER
    ↓
MONTHLY VAT REPORT
```

| Sheet                  | Layer        | Purpose                        |
| ---------------------- | ------------ | ------------------------------ |
| Control Panel          | Presentation | Parameters and KPI monitoring  |
| Shopify Import         | Data         | Shopify raw CSV ingestion      |
| Etsy Import            | Data         | Etsy raw CSV ingestion         |
| Normalization Engine   | Engine       | Unified transaction ledger     |
| VAT Calculation Engine | Calculation  | Tax computation and allocation |
| Validation Center      | Validation   | Exception detection            |
| Monthly VAT Report     | Output       | Filing-ready reporting         |

Validation always occurs before reporting outputs become operationally trustworthy.

---

### Three Traps That Catch Even Experienced Ecommerce Finance Teams

#### Trap 1 — Assuming Platform Tax Equals Tax Liability

1. A filing decision was made.
2. The decision relied on marketplace tax amounts.
3. Platform tax logic differed from filing jurisdiction rules.
4. The filing amount became inaccurate.

| Metric         | Platform | Actual  |
| -------------- | -------- | ------- |
| Gross Sales    | €50,000  | €50,000 |
| Platform Tax   | €7,600   | —       |
| Calculated VAT | —        | €8,042  |

**Incorrect conclusion:**

```text
VAT payable = Platform tax collected
```

**Correct approach:**

```text
VAT payable
= Gross Sales
- Net Sales
- Refund VAT adjustments
```

<details>
<summary>Formula logic</summary>

```excel
Net Sales = Gross/(1+VAT Rate)

Output VAT = Gross-Net Sales

Net VAT Payable = Output VAT-Refund VAT
```

</details>

---

#### Trap 2 — Ignoring Refund Tax Recovery

1. Refunds occurred.
2. VAT recovery was omitted.
3. Tax liability remained overstated.

| Item       | Without Recovery | With Recovery |
| ---------- | ---------------- | ------------- |
| Sales VAT  | €12,300          | €12,300       |
| Refund VAT | €0               | €1,120        |
| Final VAT  | €12,300          | €11,180       |

The analytical mistake is treating refunds as revenue adjustments instead of tax adjustments.

<details>
<summary>Formula logic</summary>

```excel
Refund VAT
=
Refund Amount
× VAT Rate
÷ (1+VAT Rate)
```

</details>

---

#### Trap 3 — Assuming Country Codes Are Always Correct

1. Filing calculations were performed.
2. Country assignments contained errors.
3. VAT jurisdiction allocation became incorrect.

Example:

| Transaction | Country |
| ----------- | ------- |
| TX-10025    | DE      |
| TX-10026    | BLANK   |
| TX-10027    | XX      |

Without validation, these transactions silently enter filings.

Corrected approach:

```text
Country missing
OR
VAT rate unmapped
OR
Tax variance > threshold
=
Exception generated
```

<details>
<summary>Formula logic</summary>

```excel
err_country = country=""
err_unmapped = vat_rate=0
err_tax = ABS(platform-calculated)>1
```

</details>

---

### Example Scenario

An Irish apparel business sells through Shopify and Etsy during June.

| Country | Gross Sales | VAT Rate |
| ------- | ----------- | -------- |
| Ireland | €38,500     | 23%      |
| Germany | €21,000     | 19%      |
| France  | €16,400     | 20%      |

Refunds:

| Country | Refund |
| ------- | ------ |
| Germany | €2,380 |
| France  | €1,200 |

Intermediate calculations:

| Country | Output VAT | Refund VAT | Final VAT |
| ------- | ---------- | ---------- | --------- |
| Ireland | €7,199     | €0         | €7,199    |
| Germany | €3,353     | €380       | €2,973    |
| France  | €2,733     | €200       | €2,533    |

Analytical interpretation:

* Germany refund recovery reduces liability by 11%.
* France refund recovery reduces liability by 7%.
* Ireland contains no adjustment exposure.

Recommendation:

```text
Proceed with Irish filing.
Validate German refunds.
Confirm French refund classification.
Submit consolidated monthly filing.
```

Operational implication:

The workbook transforms VAT preparation from a manual reconciliation exercise into an exception-management exercise.

---

### Formula Reference

<details>
<summary>Normalization Engine</summary>

```excel
FILTER()
VSTACK()
CHOOSECOLS()
MAP()
LET()
HSTACK()
```

Purpose:

* Remove empty rows
* Normalize platforms
* Standardize country codes
* Build transaction ledger

</details>

<details>
<summary>VAT Calculation Engine</summary>

```excel
XLOOKUP()
SUMIFS()
MAP()
```

Purpose:

* VAT lookup
* Tax allocation
* Refund recovery
* Net payable calculation

</details>

<details>
<summary>Validation Engine</summary>

```excel
FILTER()
TEXTJOIN()
ABS()
IF()
LET()
```

Purpose:

* Exception detection
* Diagnostic generation
* Filing control

</details>

---

### Validation Rules

| Field           | Rule               | Error Behavior |
| --------------- | ------------------ | -------------- |
| Country Code    | Cannot be blank    | Exception      |
| VAT Rate        | Must exist         | Exception      |
| Gross Sales     | Cannot be negative | Exception      |
| Platform Tax    | Variance ≤ 1.00    | Exception      |
| Refund Amount   | Must be numeric    | Zero applied   |
| Transaction ID  | Cannot be blank    | Excluded       |
| Reporting Month | Must exist         | Report blocked |

</details>

---

## Other Tools in This Series

* **Inventory Planning & Replenishment Console** — reorder optimization and stock risk management.
* **Marketing Attribution Audit System** — channel attribution validation and spend efficiency analysis.
* **Project Cost Allocation Workbench** — labor allocation and project profitability tracking.
* **Multi-Entity Logistics Control Tower** — cross-border shipment and customs monitoring.

More tools available through the GitHub profile and distribution store.

---

## License

This project is licensed under the **Apache License 2.0**.

See the LICENSE file for details.
