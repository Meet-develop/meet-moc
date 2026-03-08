import { RelationshipLevel } from "@/contexts/relationship-context";

// AIレスポンス生成

export function generateAcceptResponse(
  relationshipLevel: RelationshipLevel,
  eventTitle: string,
  organizerName: string
): string {
  const responses = {
    HOT: [
      `${organizerName}さんの企画なら絶対参加します！${eventTitle}、超楽しみです🔥`,
      `わあ！ぜひ参加させてください！${organizerName}さんと一緒なら最高ですね✨`,
      `もちろん参加します！${eventTitle}、めちゃくちゃ楽しそう！当日が待ち遠しいです🎉`,
      `招待ありがとうございます！${organizerName}さんのイベント、絶対楽しいですよね！喜んで参加します💖`,
    ],
    NORMAL: [
      `ありがとうございます！参加させていただきます😊`,
      `${eventTitle}、面白そうですね！参加します🙌`,
      `参加させてください！楽しみにしています！`,
      `招待ありがとうございます。喜んで参加させていただきます👍`,
    ],
    BLOCK: [
      // Block設定の場合は招待自体が届かないので、通常は使われない
      `申し訳ございませんが、今回は参加を見送らせていただきます。`,
    ],
  };

  const levelResponses = responses[relationshipLevel];
  return levelResponses[Math.floor(Math.random() * levelResponses.length)];
}

export function generateDeclineResponse(
  relationshipLevel: RelationshipLevel,
  organizerName: string
): string {
  const responses = {
    HOT: [
      `${organizerName}さん、せっかくお誘いいただいたのに本当にごめんなさい😢 その日は先約があって...。また次回ぜひ誘ってください！`,
      `うわー、悔しい！その日は既に予定が入ってしまっていて...。${organizerName}さんのイベント、絶対楽しいのに残念です💦 次回はぜひ参加したいです！`,
      `本当に申し訳ありません...せっかく${organizerName}さんが誘ってくれたのに、その日は都合がつかなくて😭 また誘ってくださいね！`,
    ],
    NORMAL: [
      `せっかくお誘いいただいたのですが、その日は予定があり参加が難しそうです。申し訳ございません🙏`,
      `ありがとうございます。残念ですが、今回は参加を見送らせていただきます。`,
      `お誘いありがとうございます。都合がつかず、今回は参加できそうにありません。また機会があればよろしくお願いします。`,
      `申し訳ございません。スケジュールの都合上、今回は参加が難しいです😢`,
    ],
    BLOCK: [
      `今回は参加を見送らせていただきます。`,
      `申し訳ございませんが、参加できません。`,
    ],
  };

  const levelResponses = responses[relationshipLevel];
  return levelResponses[Math.floor(Math.random() * levelResponses.length)];
}

export function generateMaybeResponse(
  relationshipLevel: RelationshipLevel,
  eventTitle: string
): string {
  const responses = {
    HOT: [
      `${eventTitle}、すごく興味あります！スケジュール確認して返事させてください🙏✨`,
      `めっちゃ行きたいです！ただ、その日の予定がまだ確定してなくて...。確認したらすぐ返事します！`,
      `参加したい気持ちは山々なんですが、ちょっとスケジュール調整が必要で...。前向きに検討させてください！`,
    ],
    NORMAL: [
      `興味はあるのですが、スケジュールを確認させてください。`,
      `参加できるか確認して、後ほど返事させていただきます。`,
      `予定を調整してみます。確定したらご連絡します。`,
    ],
    BLOCK: [
      `検討させていただきます。`,
    ],
  };

  const levelResponses = responses[relationshipLevel];
  return levelResponses[Math.floor(Math.random() * levelResponses.length)];
}
