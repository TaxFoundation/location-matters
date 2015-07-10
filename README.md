# Location Matters 2015

This is a digital version of Tax Foundation's Location Matters 2015 report.

## Data Structure

The state-level data for Location Matters is structured in JSON as follows:

```
{
  "name": "Alabama",
  "tier1": "Birmingham",
  "tier2": "Montgomery",
  "firms": [
    {
      "name": "Corporate Headquarters",
      "tier": "tier1",
      "taxes": [
        {
          "name": "Property Tax",
          "new": 0.0113,
          "old": 0.0113
        },
        ...
      ]
    },
    ...
},
...
```
