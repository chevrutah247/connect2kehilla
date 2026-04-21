/**
 * One-off fix: strip numeric prefix from resident names.
 *
 * Root cause: scripts/import_jbd_full.ts:buildName() prepended `r.title`
 * to the resident's first/last name. For some JBD source records, `title`
 * contained a digit (e.g. "1") — probably an index/family-size from the
 * original directory — which ended up concatenated: "1 Aba BONSTEIN".
 *
 * This script:
 *   1) reports how many records match `^<digits> ` in `name`
 *   2) shows a sample of 10 affected names
 *   3) runs a single SQL UPDATE that regex-strips the prefix
 *
 * Run:    npx tsx scripts/fix-resident-name-prefix.ts
 * Dry:    npx tsx scripts/fix-resident-name-prefix.ts --dry
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const dry = process.argv.includes('--dry')

  // Count affected rows — records whose name starts with "<digits> "
  const [{ count }] = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "Business"
    WHERE name ~ '^[0-9]+ '
  `
  const affected = Number(count)
  console.log(`Affected rows: ${affected.toLocaleString()}`)

  if (affected === 0) {
    console.log('Nothing to fix.')
    return
  }

  // Sample 10 names before/after
  const samples = await prisma.$queryRaw<{ id: string; name: string; fixed: string }[]>`
    SELECT id, name, regexp_replace(name, '^[0-9]+ ', '') AS fixed
    FROM "Business"
    WHERE name ~ '^[0-9]+ '
    ORDER BY name
    LIMIT 10
  `
  console.log('\nSample (first 10):')
  for (const s of samples) {
    console.log(`  "${s.name}"  →  "${s.fixed}"`)
  }

  if (dry) {
    console.log('\n--dry supplied, not updating.')
    return
  }

  const res = await prisma.$executeRaw`
    UPDATE "Business"
    SET name = regexp_replace(name, '^[0-9]+ ', '')
    WHERE name ~ '^[0-9]+ '
  `
  console.log(`\nUpdated rows: ${res}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
