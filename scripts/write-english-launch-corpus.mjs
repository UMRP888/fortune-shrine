import { writeFileSync } from "node:fs";

const outputPath = new URL("../public/assets/blessing-corpus-v1.md", import.meta.url);

const sections = [
  {
    title: "01 Results & Value",
    entries: [
      ["01-001", "S", "Results & Value", "One loss is not enough to define the one who judged."],
      ["01-002", "S", "Results & Value, Self-Blame", "One mistaken judgment does not make you a mistaken person."],
      ["01-003", "S", "Results & Value, Hope & Continuation", "Please do not let the worst day define the whole life."],
      ["01-004", "S", "Results & Value, Shame & Dignity", "The result belongs to the future. Dignity belongs to this moment."],
      ["01-005", "S", "Results & Value", "Results may decide gain and loss. They should not decide your worth."],
      ["01-006", "A", "Results & Value", "Remember. The storm cannot prove your worth. Calm waters cannot prove it either."],
      ["01-007", "A", "Results & Value, Loss & Regret", "Please do not let one rejection deny your value."],
      ["01-008", "A", "Results & Value", "Please do not let being lost today make you doubt that you once set out."],
      ["01-009", "A", "Results & Value", "Please do not let one moment of defeat make you forget why you began."],
      ["01-010", "A", "Results & Value", "Please do not let today's low place deny yesterday's courage."],
      ["01-011", "A", "Results & Value, Shame & Dignity", "The Shrine does not define a visitor by winning or losing. Wins and losses always change."],
      ["01-012", "A", "Results & Value, Hope & Continuation", "Remember. You are wider than this one circumstance."]
    ]
  },
  {
    title: "02 Risk & Burden",
    entries: [
      ["02-001", "S", "Risk & Burden", "The Shrine honors everyone who has carried risk."],
      ["02-002", "S", "Risk & Burden", "The one who bears the result deserves more respect than the one who only watches it."],
      ["02-003", "S", "Risk & Burden", "The world has no shortage of commentators. What is rare is the one who bears the weight."],
      ["02-004", "S", "Risk & Burden, Waiting & Uncertainty", "Not everyone is willing to carry uncertainty. Those who do are already worthy of respect."],
      ["02-005", "S", "Risk & Burden", "The Shrine does not ask how much you won. The Shrine asks what you carried."],
      ["02-006", "S", "Risk & Burden", "Those who carry uncertainty are already worthy of blessing."],
      ["02-007", "A", "Risk & Burden", "The Shrine honors everyone willing to bear the consequence. This is not easy."],
      ["02-008", "A", "Risk & Burden", "The Shrine honors everyone who seriously bears the consequence, whatever the result."],
      ["02-009", "A", "Risk & Burden", "Many envy the result. Few understand the cost. The Shrine sees the cost."],
      ["02-010", "A", "Risk & Burden", "Not every act of persistence succeeds. Every act of persistence deserves respect."],
      ["02-011", "A", "Risk & Burden", "Not every act of persistence brings a result. Every act of persistence has weight."],
      ["02-012", "A", "Risk & Burden", "Not every act of persistence is rewarded. Persistence is still worthy of respect."],
      ["02-013", "A", "Risk & Burden, Choice & Judgment", "Not every choice will be right. Everyone who chooses seriously deserves respect."],
      ["02-014", "A", "Risk & Burden", "Many precious things in this world arrive with uncertainty."],
      ["02-015", "A", "Risk & Burden", "Those who carry uncertainty walk a road that few are willing to take."],
      ["02-016", "A", "Risk & Burden", "Everyone who placed a serious stake once seriously believed in something."],
      ["02-017", "B", "Risk & Burden", "Not every cost means a mistake. Some costs are tuition for growth."],
      ["02-018", "B", "Risk & Burden", "The first thing some storms teach is not victory. It is humility."]
    ]
  },
  {
    title: "03 Waiting & Uncertainty",
    entries: [
      ["03-001", "S", "Waiting & Uncertainty", "What torments people is often not the result, but the waiting for it."],
      ["03-002", "S", "Waiting & Uncertainty", "The hardest part of waiting is not the unknown. It is having to keep living inside it."],
      ["03-003", "S", "Waiting & Uncertainty", "Some answers do not appear at once. May you still live well outside the answer."],
      ["03-004", "A", "Waiting & Uncertainty, Choice & Judgment", "The answer belongs to the future. Judgment belongs to the present."],
      ["03-005", "A", "Waiting & Uncertainty", "Some questions have no answer for now. That does not prevent you from continuing to live."],
      ["03-006", "A", "Waiting & Uncertainty", "The Shrine knows. Some people are not afraid of failure. They are afraid of being disappointed again."],
      ["03-007", "A", "Waiting & Uncertainty", "Some weight cannot be put down at once. The Shrine will not hurry you."],
      ["03-008", "A", "Waiting & Uncertainty", "Sometimes what exhausts you is not the length of the road, but the absence of an end in sight."],
      ["03-009", "A", "Waiting & Uncertainty, Hope & Continuation", "Please allow yourself to move slowly. Slow is not the same as stopped."],
      ["03-010", "B", "Waiting & Uncertainty", "Some answers arrive too late. But late is still lighter than never."],
      ["03-011", "A", "Waiting & Uncertainty", "Not every night must be defeated. Some nights only need to be walked through."],
      ["03-012", "A", "Waiting & Uncertainty", "Sometimes what exhausts a person is not moving forward, but remaining unresolved."],
      ["03-013", "A", "Waiting & Uncertainty", "The Shrine does not blame the visitor's fear. The unknown is frightening by nature."],
      ["03-014", "S", "Waiting & Uncertainty", "The Shrine knows. Some people have not lost sight of hope. They have only waited too long."],
      ["03-015", "A", "Waiting & Uncertainty", "Please do not mistake a long road for standing still."],
      ["03-016", "A", "Waiting & Uncertainty, Risk & Burden", "The Shrine sees your patience. Patience itself is a kind of burden."],
      ["03-017", "A", "Waiting & Uncertainty, Loss & Regret", "Sometimes the hardest thing to accept is not losing, but not receiving for so long."],
      ["03-019", "A", "Waiting & Uncertainty", "Please do not take temporary silence as destiny's answer."],
      ["03-020", "A", "Waiting & Uncertainty", "The Shrine knows. Some waiting will not become shorter, but people can grow inside it."],
      ["03-021", "B", "Waiting & Uncertainty, Hope & Continuation", "Some doors have not opened yet. That does not mean they will never open."],
      ["03-022", "A", "Waiting & Uncertainty", "Please allow the future to keep its own time."],
      ["03-023", "A", "Waiting & Uncertainty, Understanding", "The Shrine sees the waiting no one else knows about."],
      ["03-024", "A", "Waiting & Uncertainty", "Please do not declare yourself failed before the answer arrives."],
      ["03-025", "A", "Waiting & Uncertainty, Hope & Continuation", "The Shrine knows. Some hope has not gone out. It has only sunk for a while into the night."],
      ["03-026", "B", "Waiting & Uncertainty", "Some results are late, but they are not absent."],
      ["03-027", "A", "Waiting & Uncertainty", "The Shrine knows. Many important things need time."],
      ["03-028", "A", "Waiting & Uncertainty", "Sometimes the greatest pressure comes from not knowing how much longer you must wait."],
      ["03-029", "A", "Waiting & Uncertainty", "Please do not treat waiting as emptiness. You are still living."],
      ["03-030", "A", "Waiting & Uncertainty, Risk & Burden", "The Shrine sees your persistence, even before the result appears."],
      ["03-031", "A", "Waiting & Uncertainty", "Some answers belong to the future. Today is still worth living seriously."],
      ["03-032", "B", "Waiting & Uncertainty", "Remember. Not all progress can be seen."],
      ["03-033", "B", "Waiting & Uncertainty", "The Shrine knows. Some roads are growing underground."],
      ["03-034", "B", "Waiting & Uncertainty", "No news is not always bad news."],
      ["03-035", "A", "Waiting & Uncertainty, Results & Value", "Please do not let silence make you doubt your worth."],
      ["03-036", "A", "Waiting & Uncertainty, Risk & Burden", "The Shrine sees that you are still keeping watch. Keeping watch requires strength."],
      ["03-037", "B", "Waiting & Uncertainty, Hope & Continuation", "Some wishes have not yet come true. They are still worth cherishing."],
      ["03-038", "A", "Waiting & Uncertainty", "Please do not let the long road make you forget why you began."],
      ["03-039", "A", "Waiting & Uncertainty", "The Shrine knows. Waiting is also part of fate."],
      ["03-040", "B", "Waiting & Uncertainty, Hope & Continuation", "Some things are coming closer. They simply have not yet been seen."],
      ["03-041", "S", "Waiting & Uncertainty", "Please allow the answer to arrive a little later, while you live well first."],
      ["03-042", "S", "Waiting & Uncertainty, Choice & Judgment", "The answer has not appeared yet. Please do not hurry to doubt yourself."],
      ["03-043", "S", "Choice & Judgment, Waiting & Uncertainty", "The future has not spoken yet. There is no need to pronounce right or wrong."],
      ["03-044", "S", "Choice & Judgment, Loss & Regret", "A mistaken judgment is not a mistaken person."],
      ["03-045", "S", "Waiting & Uncertainty, Hope & Continuation", "Leave the result to the future. Tonight, only be responsible for rest."],
      ["03-046", "S", "Risk & Burden, Choice & Judgment", "Those who carry risk are closer to the answer than those who only watch."],
      ["03-047", "S", "Choice & Judgment, Waiting & Uncertainty", "You have judged as carefully as you could. The rest belongs to the future."],
      ["03-048", "S", "Waiting & Uncertainty, Risk & Burden", "Some waiting is itself a form of courage."],
      ["03-049", "A", "Waiting & Uncertainty, Hope & Continuation", "Please allow the future to arrive at its own speed."],
      ["03-050", "S", "Choice & Judgment, New Beginning", "Judgment can be corrected. So can life."],
      ["03-051", "A", "Choice & Judgment, Waiting & Uncertainty", "Some decisions can only be understood after they have been walked through."],
      ["03-052", "S", "Waiting & Uncertainty, Choice & Judgment, Hope & Continuation", "Uncertainty in this moment does not mean the direction is wrong."],
      ["03-053", "S", "Choice & Judgment, Risk & Burden", "You cannot control the result. But you have carried the choice."],
      ["03-054", "S", "Waiting & Uncertainty", "Waiting is a road. It is not a punishment."],
      ["03-055", "A", "Waiting & Uncertainty, Loss & Regret", "Not every silence means failure."],
      ["03-056", "A", "Choice & Judgment, Waiting & Uncertainty", "A judgment that cannot be verified today may still have an answer tomorrow."],
      ["03-057", "A", "Waiting & Uncertainty, Hope & Continuation", "The future is still being written. Please do not turn to the final page too soon."],
      ["03-058", "S", "Choice & Judgment, Waiting & Uncertainty", "Not everything correct is proven immediately."],
      ["03-059", "A", "Waiting & Uncertainty, Hope & Continuation", "What cannot be seen clearly now may not remain unclear forever."],
      ["03-060", "A", "Choice & Judgment, Waiting & Uncertainty", "The meaning of some choices appears only much later."],
      ["03-061", "S", "Waiting & Uncertainty, Choice & Judgment", "Do not mistake the unknown for rejection."],
      ["03-062", "A", "Choice & Judgment, New Beginning", "Some doors, once opened, can only be walked through."],
      ["03-063", "S", "Waiting & Uncertainty, Hope & Continuation", "A late answer is not an absent answer."],
      ["03-064", "A", "Waiting & Uncertainty", "Please allow time to complete its part of the work."],
      ["03-065", "A", "Waiting & Uncertainty, Choice & Judgment", "The future has not issued its final judgment."],
      ["03-066", "S", "Waiting & Uncertainty, Risk & Burden", "You do not have to be certain every moment."],
      ["03-067", "S", "Risk & Burden, Waiting & Uncertainty", "Those who carry risk must walk with the unknown."],
      ["03-068", "A", "Waiting & Uncertainty", "No one can possess every answer in advance."],
      ["03-069", "S", "Waiting & Uncertainty, Risk & Burden", "Please allow yourself not to know for now."],
      ["03-070", "S", "Risk & Burden, Waiting & Uncertainty", "Courage is not certainty. Courage is continuing inside uncertainty."],
      ["03-071", "A", "Waiting & Uncertainty, Choice & Judgment", "Some roads can only be seen while walking."],
      ["03-072", "S", "Waiting & Uncertainty, Choice & Judgment", "The future is not an examiner. The future is only the future."],
      ["03-073", "S", "Waiting & Uncertainty, Hope & Continuation", "The result has not arrived yet. Please be gentle with the self that is waiting."],
      ["03-074", "A", "Waiting & Uncertainty, Choice & Judgment", "Do not let anxiety announce failure early."],
      ["03-075", "S", "Waiting & Uncertainty, Hope & Continuation", "Some seeds need a longer season."],
      ["03-076", "A", "Waiting & Uncertainty, Hope & Continuation", "Today's confusion may not be tomorrow's confusion."],
      ["03-077", "A", "Choice & Judgment, Hope & Continuation", "Time does not disregard every serious thought."],
      ["03-078", "S", "Waiting & Uncertainty, Hope & Continuation", "May you keep peace even inside the unknown."],
      ["03-079", "S", "Choice & Judgment, Risk & Burden", "Please do not let fear replace judgment."],
      ["03-080", "S", "Choice & Judgment, New Beginning, Loss & Regret", "You may revise the decision without denying the life."],
      ["03-081", "A", "Waiting & Uncertainty, Hope & Continuation", "Look a little farther. Tonight is not the ending."],
      ["03-082", "A", "Risk & Burden", "You have already taken that step. That alone deserves respect."],
      ["03-083", "S", "Risk & Burden", "Risk has never been the road of the weak."]
    ]
  },
  {
    title: "04 Loss & Regret",
    entries: [
      ["04-001", "S", "Loss & Regret", "One of the heaviest burdens is looking back again and again at the yesterday that might have been different. May you lay down the life that never happened."],
      ["04-002", "S", "Loss & Regret", "Sometimes what you miss is not the chance itself, but the self who once carried hope."],
      ["04-003", "A", "Loss & Regret", "Some losses cannot be repaired. Life has not stopped moving because of them."],
      ["04-004", "A", "Loss & Regret", "Not every loss means failure. Some losses are simply the cost."],
      ["04-005", "A", "Loss & Regret, Results & Value", "Please do not let one loss deny everything you once had."],
      ["04-006", "A", "Loss & Regret", "The Shrine knows. Some goodbyes arrive before a person is ready."],
      ["04-007", "A", "Loss & Regret", "Sometimes what you lost was not the chance itself, but the expectation you placed upon it."],
      ["04-008", "A", "Loss & Regret", "Some wounds do not disappear. But they will one day stop bleeding."],
      ["04-009", "A", "Loss & Regret", "Sometimes what a person must accept is not the result, but that the result has already happened."],
      ["04-010", "A", "Loss & Regret", "The Shrine knows. Some departures were not caused by a lack of effort."],
      ["04-011", "A", "Loss & Regret", "Some answers disappoint. But disappointment is still more real than fantasy."],
      ["04-012", "A", "Loss & Regret", "You cannot change what has happened. But you do not have to live inside it forever."],
      ["04-013", "B", "Loss & Regret", "Some losses bring pain. Some losses bring clarity."],
      ["04-014", "A", "Loss & Regret, Self-Blame", "Please do not carry every regret on your back. Some regrets were never yours."],
      ["04-015", "A", "Loss & Regret", "Some things have passed. Some effects remain. This is normal."],
      ["04-016", "A", "Loss & Regret", "Not every disappointment comes from the result. Some disappointments come from expectation."],
      ["04-017", "A", "Loss & Regret", "The Shrine knows. For some, the deepest pain is not loss, but the feeling that they should not have lost."],
      ["04-018", "A", "Loss & Regret", "The Shrine knows. Some people did not lose money. They lost the night when they still believed in themselves."],
      ["04-019", "A", "Loss & Regret", "Not every missed thing must be recovered. Some missed things only need to be released."],
      ["04-020", "A", "Loss & Regret", "The result has already happened. Please do not let yesterday keep wounding today."],
      ["04-021", "B", "Loss & Regret", "Not every answer will satisfy. But an answer is still lighter than endless guessing."]
    ]
  },
  {
    title: "05 Self-Blame",
    entries: [
      ["05-001", "S", "Self-Blame", "Sometimes the heaviest burden is not failure. It is self-blame."],
      ["05-002", "S", "Self-Blame", "Some wounds come from the result. Some wounds come from self-blame. The latter often cuts deeper."],
      ["05-003", "S", "Self-Blame", "Please do not place all responsibility on yourself. Some things were always beyond human control."],
      ["05-004", "A", "Self-Blame", "The Shrine knows. Sometimes the hardest person to forgive is yourself."],
      ["05-005", "A", "Self-Blame", "Sometimes letting yourself go is harder than forgiving someone else."],
      ["05-006", "A", "Self-Blame", "Not every mistake requires punishment. Some mistakes only require learning."],
      ["05-007", "A", "Self-Blame", "You have carried much already. You do not need to punish yourself further."],
      ["05-008", "A", "Self-Blame", "Please do not turn every mistake into a sin. To be human is to err."],
      ["05-009", "A", "Self-Blame", "The Shrine knows. The longest road often leads toward self-forgiveness."],
      ["05-010", "A", "Self-Blame", "You may doubt the result. Do not doubt that you once cared seriously."]
    ]
  },
  {
    title: "06 Understanding",
    entries: [
      ["06-001", "S", "Understanding", "Others see only the result. The Shrine sees the road that brought you here."],
      ["06-002", "S", "Understanding, Confidence & Recovery", "The Shrine knows. Some people did not lose money. They lost confidence in themselves."],
      ["06-003", "S", "Understanding, Loneliness", "Sometimes what a person needs is not an answer, but a place where they will not be mocked."],
      ["06-004", "A", "Understanding", "The weight you carry is far greater than what others can see."],
      ["06-005", "A", "Understanding", "The Shrine never mocks the visitor's weakness. Carrying is not easy."],
      ["06-006", "A", "Understanding", "The Shrine knows. Some silences are more exhausting than tears."],
      ["06-007", "A", "Understanding", "The Shrine knows. Some people look calm on the surface while storms have long gathered within."],
      ["06-008", "A", "Understanding", "The Shrine knows. Sometimes people are wounded by their own expectations."],
      ["06-009", "A", "Understanding", "The Shrine knows. Sometimes what a person truly misses is not the past, but the self they were then."],
      ["06-010", "A", "Understanding", "The Shrine knows. Some nights are spent making peace with oneself."],
      ["06-011", "A", "Understanding", "The Shrine sees your silence. Some exhaustion is not meant to be explained to others."],
      ["06-012", "A", "Understanding", "The Shrine will not leave because you failed. Failure is never the whole of a visitor."],
      ["06-013", "B", "Understanding", "The Shrine knows. Sometimes what a person needs most is a moment of peace."],
      ["06-014", "A", "Understanding", "The Shrine sees your regret. Regret often comes from having cared seriously."],
      ["06-015", "A", "Understanding", "The Shrine sees your unwillingness to let go. It means you are still taking fate seriously."],
      ["06-016", "A", "Understanding", "The Shrine sees your unwillingness to let go. It means you still care."]
    ]
  },
  {
    title: "07 Hope & Continuation",
    entries: [
      ["07-001", "S", "Hope & Continuation", "The long night has not ended. And your story has not ended either."],
      ["07-002", "S", "Hope & Continuation", "Please do not let one storm make you doubt your whole ocean."],
      ["07-003", "A", "Hope & Continuation", "Some storms changed the result. They did not change you."],
      ["07-004", "A", "Hope & Continuation", "Please believe this moment is not the final chapter of you."],
      ["07-005", "A", "Hope & Continuation", "The Shrine does not measure visitors by speed. To continue is already rare."],
      ["07-006", "A", "Hope & Continuation", "Please do not let one fall make you forget how far you have already walked."],
      ["07-007", "A", "Hope & Continuation", "Please do not let the storm that remains hide the distance you have already crossed."],
      ["07-008", "B", "Hope & Continuation", "Some roads have no shortcut. You are already on the road."],
      ["07-009", "A", "Hope & Continuation", "The Shrine honors those who are still willing to face tomorrow."],
      ["07-010", "A", "Hope & Continuation", "Please do not mistake a temporary low place for an eternal fate."],
      ["07-011", "A", "Hope & Continuation", "You have already crossed one of the hardest parts: admitting that you were hurt."],
      ["07-012", "A", "Hope & Continuation", "The Shrine does not require visitors to be fearless. To continue is already rare."],
      ["07-013", "B", "Hope & Continuation", "Some roads receive no applause. They are still worth walking."],
      ["07-014", "A", "Hope & Continuation", "Some storms took many things from you. They did not take your persistence."],
      ["07-015", "B", "Hope & Continuation", "Some things cannot be done again. You are still worthy of blessing."],
      ["07-016", "A", "Hope & Continuation", "Sometimes what you must overcome is not the outside world, but despair."],
      ["07-017", "A", "Hope & Continuation", "Some things have not happened. That does not mean your effort had no meaning."],
      ["07-019", "A", "Hope & Continuation", "Please do not let today's lack of fruit deny the seeds you planted yesterday."]
    ]
  },
  {
    title: "08 New Beginning",
    entries: [
      ["08-001", "S", "New Beginning, Confidence & Recovery", "The Shrine sees that you want to begin again. It means you still care."],
      ["08-002", "A", "New Beginning", "Please allow yourself to recover slowly. Not every wound should be hurried."],
      ["08-003", "A", "New Beginning", "After some storms end, a person must learn to believe in sunlight again."],
      ["08-004", "A", "New Beginning, Confidence & Recovery", "The Shrine knows. Believing in yourself again is not easy."],
      ["08-005", "A", "New Beginning, Confidence & Recovery", "The Shrine knows. Believing in yourself again takes time."],
      ["08-006", "A", "New Beginning", "Please do not let one fall make you push yourself down too."]
    ]
  },
  {
    title: "09 Loneliness",
    entries: [
      ["09-001", "S", "Loneliness", "One of the loneliest moments in the world is when no one else can decide for you."],
      ["09-002", "A", "Loneliness, Understanding", "Please do not deny your pain just because no one understands it."]
    ]
  },
  {
    title: "10 Choice & Judgment",
    entries: [
      ["10-001", "S", "Choice & Judgment", "Please do not let one mistaken judgment make you doubt all of your judgment."],
      ["10-002", "A", "Choice & Judgment", "The Shrine sees your hesitation. Important things naturally make people hesitate."],
      ["10-003", "A", "Choice & Judgment", "The Shrine sees your unease, because the future has not yet spoken."],
      ["10-004", "A", "Choice & Judgment", "Some people fear failure. Some people fear trying again."],
      ["10-005", "A", "Choice & Judgment", "Your hesitation does not mean weakness. It means you are taking the choice seriously."],
      ["10-006", "A", "Choice & Judgment", "Some roads are hard not because they are wrong, but because they were always hard."]
    ]
  },
  {
    title: "11 Shame & Dignity",
    entries: [
      ["11-001", "S", "Shame & Dignity", "The Shrine sees your shame. But shame should not become a chain."],
      ["11-002", "S", "Shame & Dignity", "Some people lose the result but keep their dignity. That is precious too."],
      ["11-003", "A", "Shame & Dignity", "Please allow yourself to grieve. Grief does not mean failure."],
      ["11-004", "A", "Shame & Dignity", "Not every pain must be hidden. To admit it is also a kind of courage."],
      ["11-005", "A", "Shame & Dignity", "Some people lose to the result. Some lose to themselves. May you not become the latter."]
    ]
  },
  {
    title: "12 Confidence & Recovery",
    entries: [
      ["12-001", "S", "Confidence & Recovery", "True failure is not one loss. It is never believing in yourself again."],
      ["12-002", "A", "Confidence & Recovery", "The Shrine knows. Some people are not defeated by the result, but by who they become afterward."]
    ]
  }
];

const categoryIndex = sections.map((section) => section.title);

const lines = [
  "# Fortune Shrine Blessing Corpus v1.0",
  "",
  "Launch language policy:",
  "",
  "- English-only production pool.",
  "- No Chinese text in public blessing flow.",
  "- Original Chinese corpus is retained in docs as source material.",
  "- Bless the state. Never bless the outcome.",
  "",
  "## Category Index",
  "",
  ...categoryIndex.map((title) => title),
  ""
];

for (const section of sections) {
  lines.push("---", "", `## ${section.title}`, "");
  for (const [id, tier, categories, text] of section.entries) {
    lines.push(`### ${id} [${tier}] [${categories}]`, text, "");
  }
}

writeFileSync(outputPath, `${lines.join("\n").trim()}\n`);
console.log(`Wrote ${outputPath.pathname}`);
