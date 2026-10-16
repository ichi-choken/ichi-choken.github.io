// ===== おすすめチャンネル（カテゴリー別） =====
// 検索APIを使わずにチャンネルを選べるよう，チャンネルIDを固定で持つ．
// 表示する名前・アイコンは channels.list で取得したものを使う（ここの name は開発者用のメモ）．
// IDは 2026-10-16 に各チャンネルページで確認．取得できなかったIDは画面に出さない．
export const PRESET_CATEGORIES = [
    {
        id: 'news', icon: '📰', label: 'ニュース', keyword: 'ニュース',
        channels: [
            { id: 'UCip8ve30-AoX2y2OtAAmqFA', name: 'NHK' },
            { id: 'UCGCZAYq5Xxojl_tSXcVJhiQ', name: 'ANNnewsCH' },
            { id: 'UC6AG81pAkf6Lbi_1VC5NmPA', name: 'TBS NEWS DIG Powered by JNN' },
            { id: 'UCuTAXTexrhetbOe3zgskJBQ', name: '日テレNEWS' },
            { id: 'UCoQBJMzcwmXrRSHBFAlTsIw', name: 'FNNプライムオンライン' },
        ],
    },
    {
        id: 'cooking', icon: '🍳', label: '料理', keyword: '料理 レシピ',
        channels: [
            { id: 'UCW01sMEVYQdhcvkrhbxdBpw', name: '料理研究家リュウジのバズレシピ' },
            { id: 'UC3p5OTQsMEnmZktWUkw_Y0A', name: 'Koh Kentetsu Kitchen' },
            { id: 'UCE40kwov-UdhGikwAowjAAQ', name: 'Kurashiru' },
            { id: 'UC4YYMfsqUrejYXKnV--BydQ', name: 'デリッシュキッチン' },
        ],
    },
    {
        id: 'health', icon: '🧘', label: '体操・健康', keyword: '体操 ストレッチ',
        channels: [
            { id: 'UCw7HTQv0F4CB9zGRhqosYsg', name: 'Marina Takewaki' },
            { id: 'UC-a9wiNTKiLIRLTyIRdNbMg', name: 'OGATORE' },
            { id: 'UCb4-om3UY151Hu1uCR8Q19Q', name: 'Muscle Watching' },
        ],
    },
    {
        id: 'learning', icon: '📚', label: '学び・教養', keyword: '解説 教養',
        channels: [
            { id: 'UCqmWJJolqAgjIdLqK3zD1QQ', name: '予備校のノリで学ぶ「大学の数学・物理」' },
            { id: 'UCQ_MqAw18jFTlBB-f8BP7dw', name: 'QuizKnock' },
            { id: 'UCmpkIzF3xFzhPez7gXOyhVg', name: 'ゆる言語学ラジオ' },
        ],
    },
    {
        id: 'animals', icon: '🐧', label: '動物・水族館', keyword: '動物園 水族館',
        channels: [
            { id: 'UC-veA4H0QF3Ev4uZe9vpQrQ', name: '大阪・海遊館' },
            { id: 'UCUzl3bi1SfjT_uJIiGjzhag', name: '鴨川シーワールド' },
            { id: 'UC71D1vqyo-_vJnThe7IqRvA', name: '新江ノ島水族館' },
            { id: 'UCRVruzlQF5cqpw9jQgIgNdw', name: 'mugumogu（猫のまる）' },
        ],
    },
    {
        id: 'travel', icon: '🗾', label: '旅・街歩き', keyword: '街歩き 旅',
        channels: [
            { id: 'UCAcsAE1tpLuP3y7UhxUoWpQ', name: 'Rambalac' },
            { id: 'UCSPEjw8F2nQDtmUKPFNF7_A', name: 'NHK WORLD-JAPAN' },
        ],
    },
    {
        id: 'hobby', icon: '🎵', label: '音楽・趣味', keyword: '趣味',
        channels: [
            { id: 'UC9zY_E8mcAo_Oq772LEZq8Q', name: 'THE FIRST TAKE' },
            { id: 'UCD3Fn-CEXK9vPIoixSZGZ2Q', name: '日本将棋連盟' },
            { id: 'UCts0UPnL4A3kaeuFa-6Cmlg', name: 'Daisuke Miyazaki（家庭菜園）' },
        ],
    },
];
