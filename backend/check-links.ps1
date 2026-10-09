# Checks every resource and community URL in the seed catalog and prints the ones that do not return 200.
# Some sites (for example Stack Overflow) block scripts with 403 but work fine in a browser.
$catalog = Get-Content "$PSScriptRoot\CareerPath.Api\Data\Seed\catalog.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$urls = foreach ($field in $catalog) {
    foreach ($sub in $field.subFields) {
        $i = 0
        foreach ($step in $sub.roadmapSteps) { $i++; [pscustomobject]@{ Where = "$($sub.slug) step $i"; Url = $step.resourceUrl } }
        foreach ($c in $sub.communities) { [pscustomobject]@{ Where = "$($sub.slug) community"; Url = $c.url } }
    }
}

$failures = 0
foreach ($item in $urls) {
    $status = curl.exe -sL -b NUL -o NUL -w "%{http_code}" --max-time 20 -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0" $item.Url
    if ($status -ne '200') {
        $failures++
        "{0,-28} {1,-4} {2}" -f $item.Where, $status, $item.Url
    }
}
"Checked $($urls.Count) links, $failures did not return 200."
