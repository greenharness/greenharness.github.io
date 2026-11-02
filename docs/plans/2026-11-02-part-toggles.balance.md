# Part toggles: balance runs, per seed

`node scripts/balance.mjs http://127.0.0.1:8743/index.html 20` against the branch, km driven per
seed (1000–1019). The first table is the first run, guardrails at limit 0.86, −4 s, speed × 0.25;
the second re-runs all-on and guardrails after the retune (limit 0.80, −6 s, speed × 0.15).

A seed does not give the same distance from one run of the script to the next: all-on seed 1000
drove 6.09 km, then 7.06 km; seed 1012, 6.62 km, then 5.36 km. Within one run the configurations
share their seeds, so each pair compares like with like, and the conclusions rest on the paired
means, whose margins are wide (guardrails 38.0 % against a 10 % bar). A re-run reproduces the
means within a few points, not the per-seed values. holds-until: the variation is traced (the bot
reads the snapshot between clock steps, so input timing can differ by a frame).

## First run

| seed      | all-on | guardrails | gate   | decisions | router | conform | attest |
| --------- | ------ | ---------- | ------ | --------- | ------ | ------- | ------ |
| 1000      | 6.09   | 3.84       | 1.59   | 3.76      | 5.37   | 3.25    | 1.98   |
| 1001      | 5.74   | 5.76       | 2.26   | 3.30      | 5.07   | 3.90    | 2.76   |
| 1002      | 5.01   | 4.35       | 2.23   | 3.40      | 5.01   | 3.55    | 3.43   |
| 1003      | 7.11   | 5.44       | 1.86   | 3.58      | 5.42   | 4.41    | 3.35   |
| 1004      | 5.69   | 5.14       | 2.49   | 3.75      | 6.63   | 4.30    | 3.69   |
| 1005      | 6.65   | 4.89       | 2.20   | 2.12      | 5.09   | 4.53    | 3.00   |
| 1006      | 6.36   | 7.58       | 1.94   | 2.76      | 5.56   | 5.09    | 2.82   |
| 1007      | 3.34   | 3.99       | 2.13   | 3.27      | 3.95   | 3.21    | 2.60   |
| 1008      | 5.36   | 4.78       | 2.10   | 2.90      | 4.70   | 5.19    | 2.74   |
| 1009      | 5.05   | 4.99       | 2.15   | 3.53      | 5.04   | 3.35    | 2.51   |
| 1010      | 5.18   | 4.40       | 1.92   | 3.78      | 2.76   | 3.05    | 2.30   |
| 1011      | 5.49   | 5.25       | 2.20   | 3.22      | 4.79   | 3.62    | 3.19   |
| 1012      | 6.62   | 5.98       | 2.08   | 2.47      | 5.36   | 3.72    | 3.84   |
| 1013      | 6.55   | 5.64       | 2.08   | 3.74      | 5.56   | 4.99    | 3.21   |
| 1014      | 6.13   | 5.03       | 1.57   | 3.56      | 5.63   | 4.85    | 3.15   |
| 1015      | 6.59   | 7.03       | 2.16   | 2.71      | 5.08   | 4.55    | 3.28   |
| 1016      | 5.58   | 4.97       | 2.10   | 3.67      | 4.32   | 3.91    | 2.69   |
| 1017      | 4.97   | 5.53       | 1.83   | 4.44      | 5.34   | 4.24    | 2.50   |
| 1018      | 7.85   | 7.40       | 2.40   | 3.71      | 6.16   | 5.33    | 3.37   |
| 1019      | 5.75   | 4.83       | 2.08   | 3.31      | 5.19   | 4.04    | 3.35   |
| mean loss | —      | 7.9 %      | 63.6 % | 40.7 %    | 11.6 % | 28.2 %  | 48.0 % |

## Guardrails after the retune

| seed      | all-on | guardrails |
| --------- | ------ | ---------- |
| 1000      | 7.06   | 3.02       |
| 1001      | 5.68   | 3.37       |
| 1002      | 4.94   | 3.51       |
| 1003      | 6.65   | 5.28       |
| 1004      | 5.67   | 3.75       |
| 1005      | 5.06   | 3.37       |
| 1006      | 6.43   | 4.98       |
| 1007      | 3.79   | 2.74       |
| 1008      | 5.36   | 3.53       |
| 1009      | 5.04   | 4.58       |
| 1010      | 5.59   | 2.69       |
| 1011      | 5.38   | 3.59       |
| 1012      | 5.36   | 3.29       |
| 1013      | 7.18   | 3.78       |
| 1014      | 5.55   | 1.92       |
| 1015      | 6.73   | 2.80       |
| 1016      | 4.74   | 3.81       |
| 1017      | 4.93   | 4.15       |
| 1018      | 7.32   | 2.73       |
| 1019      | 6.84   | 2.84       |
| mean loss | —      | 38.0 %     |
