import { useState } from 'react';
import { COLORS } from '@/lib/constants';

interface FAQItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

const ExternalLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer" 
    className="text-blue-500 font-medium"
    style={{ textDecoration: 'none' }}
  >
    {children}
  </a>
);

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-md p-3 my-4 font-mono text-sm text-gray-800">
    {children}
  </div>
);

const Strong = ({ children }: { children: React.ReactNode }) => (
  <span className="font-bold">{children}</span>
);

const faqData: FAQItem[] = [
  {
    id: 'encryption',
    question: 'How does the encryption work?',
    answer: (
      <div>
        <p>For each message, a new PGP key pair is generated locally. The message is then encrypted using the generated PGP public key. The corresponding PGP private key is subsequently split into five shares using Shamir&apos;s Secret Sharing scheme, requiring at least three shares to reconstruct the private key for decryption.</p>
        <br />
        <p>To securely store the shares, five key guardians are randomly selected from a list of users who have previously registered their PGP public keys in the platform. Each of the five shares is locally encrypted on the message author&apos;s device using the respective PGP public key of each selected key guardian. Finally, the encrypted shares are uploaded to the platform.</p>
      </div>
    )
  },
  {
    id: 'incentive',
    question: 'What is the incentive to unlock messages?',
    answer: (
      <p>The key guardians are rewarded with a fee (in CHR) set by the author of the message. Although five key guardians are selected and entrusted with encrypted shares of the private PGP key, only the first three guardians who provide their decrypted shares at the scheduled publication time are eligible for the reward. Each of these three key guardians receives 30% of the total reward, while the remaining 10% is allocated to maintain the operation of the dApp.</p>
    )
  },
  {
    id: 'storage',
    question: 'Where are the data and the rewards stored?',
    answer: (
      <p>The encrypted message, the encrypted shares of the private key, and the reward are stored on the decentralized Chromia blockchain network. Even if the Chainacy website or domain is no longer available, you can interact with the blockchain directly (for example, by saving this webpage and using it locally). This ensures messages, shares, and rewards exist independently and permanently on the blockchain.</p>
    )
  },
  {
    id: 'cancel',
    question: 'Can I cancel my message after submitting?',
    answer: (
      <p>No, this is not possible. Once your message is in the decentralized network, revocation is not supported.</p>
    )
  },
  {
    id: 'early',
    question: 'What if the message is published too early?',
    answer: (
      <p>Early disclosure of shares is economically discouraged. While a guardian is generally unable to submit a share before its designated publication time, any person who manages to obtain a decrypted share can submit it at the publication date and thereby compete with the other guardians. By revealing a share early, a guardian significantly reduces their chances of receiving a reward.</p>
    )
  },
  {
    id: 'message-expiry',
    question: 'What happens if a message cannot be published?',
    answer: (
      <p>If 30 days have passed after the author&apos;s desired publication date and still fewer than 3 decrypted shares have been submitted (which are required to reconstruct the private key for decryption), all data related to this message will be deleted from the platform. The author will be refunded their payment minus the 10% platform fee and any rewards already paid to guardians who submitted shares.</p>
    )
  },
  {
    id: 'guardian',
    question: 'How can I participate as a guardian?',
    answer: (
      <div>
        <p>To become a guardian and earn rewards by helping to unlock messages, you first need to register an account for the Chainacy dApp in the <ExternalLink href="https://vault.chromia.com/">Chromia Vault</ExternalLink>. After registration, connect your wallet on this website to log in and access the Settings.</p>
        <br />
        <p>Once you have access to the Settings, generate a PGP key pair and add your public key. If you also provide your Telegram username, you will automatically receive notifications in the Telegram app when new tasks are assigned to you, so you don&apos;t need to constantly check the website. To receive these notifications, you must also join the <ExternalLink href="https://t.me/Chainacy">Chainacy</ExternalLink> Telegram group.</p>
      </div>
    )
  },
  {
    id: 'pgp-generation',
    question: 'How do I set up PGP for guardian tasks?',
    answer: (
      <div className="space-y-4">
        <div>
          <Strong>For Desktop Users:</Strong>
          <p className="mt-2">First, you need to install GPG (GNU Privacy Guard) software on your system. You can download it from <ExternalLink href="https://gnupg.org">GnuPG</ExternalLink> for Windows, or use package managers on macOS (brew install gnupg) and Linux (apt install gnupg).</p>
          
          <p className="mt-4">To generate a PGP key pair, open your command line and run these commands:</p>
          <CodeBlock>
            gpg --batch --passphrase &apos;&apos; --quick-generate-key &quot;Your Name &lt;your@email.com&gt;&quot; default default 0<br />
            gpg --armor --export your@email.com
          </CodeBlock>
          
          <p>Note that the name and email address can also be fictional and have no relevance for the functioning of this dApp. The first command generates the key pair, and the second exports your public key in text format that you can copy and paste into the Settings.</p>
          
          <p className="mt-4">To decrypt a share that you receive as a guardian, save the encrypted share to a file (e.g., encrypted_share.txt) and run:</p>
          <CodeBlock>
            gpg --decrypt encrypted_share.txt
          </CodeBlock>
          
          <p>This will output the decrypted share that you can then submit on the platform.</p>
        </div>
        
        <div>
          <Strong>For Mobile Users:</Strong>
          <p className="mt-2">If you prefer to work on your smartphone without a PC, you can use dedicated mobile apps that provide a user-friendly interface for PGP operations:</p>
          
          <div className="mt-3 space-y-1">
            <p>• <Strong>iPhone/iPad:</Strong> Download <ExternalLink href="https://itunes.apple.com/app/id1497433694">Instant PGP</ExternalLink> from the App Store</p>
            <p>• <Strong>Android:</Strong> Download <ExternalLink href="https://play.google.com/store/apps/details?id=org.sufficientlysecure.keychain">OpenKeychain</ExternalLink> from Google Play</p>
          </div>
          
          <p className="mt-3">These apps allow you to generate PGP key pairs, export your public key, and decrypt encrypted shares directly on your mobile device without needing command line access.</p>
        </div>
      </div>
    )
  },
  {
    id: 'guardian-activity',
    question: 'How long does a guardian account remain active?',
    answer: (
      <p>After 30 days of inactivity, your guardian account will no longer be assigned new tasks. Activity is defined as either logging into the Chainacy website or sending messages in the Chainacy Telegram channel (if you have provided your Telegram username in the Settings).</p>
    )
  },
  {
    id: 'reward-access',
    question: 'How can I access my earned rewards?',
    answer: (
      <p>Your earned rewards are visible and accessible in the <ExternalLink href="https://vault.chromia.com/">Chromia Vault</ExternalLink> by selecting the Chainacy dApp. From there, you can transfer your CHR rewards to any DEX or bridge at any time.</p>
    )
  },
  {
    id: 'source-code',
    question: 'Is the source code available for review?',
    answer: (
      <div>
        <p>Yes, Chainacy is committed to transparency and open-source development. The complete source code for both the frontend application and the blockchain smart contracts (written in Rell) is publicly available on <ExternalLink href="https://github.com/Chainacy/Chainacy">GitHub</ExternalLink>.</p>
        <br />
        <p>This open-source approach ensures transparency, allows security audits by the community, and enables developers to verify the implementation of our encryption and secret sharing mechanisms.</p>
      </div>
    )
  },
  {
    id: 'donation',
    question: 'How can I support this project?',
    answer: (
      <div>
        <p>If you find Chainacy valuable and would like to support its continued development, we welcome your contribution:</p>
        
        <div className="mt-4 space-y-4">
          <div>
            <Strong>Financial Support</Strong>
            <p className="mt-2 text-gray-600">Your donations help us maintain and improve the platform:</p>
            <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Ethereum Address:</p>
              <p className="font-mono text-[10px] sm:text-sm break-all">0x09c859e05e5fEb14D24f6bA65c2F3ac0460eBA8b</p>
            </div>
          </div>
          
          <div>
            <Strong>Community & Updates</Strong>
            <p className="mt-2 text-gray-600">Stay connected with our growing community: Follow us on <ExternalLink href="https://x.com/chainacy">X</ExternalLink> and join our <ExternalLink href="https://t.me/Chainacy">Telegram</ExternalLink> group for announcements and support.</p>
          </div>
        </div>
      </div>
    )
  }
];

export const HowItWorksTab = () => {
  const [selectedFaq, setSelectedFaq] = useState<string>(faqData[0].id);

  const selectedItem = faqData.find(item => item.id === selectedFaq);

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <select
          value={selectedFaq}
          onChange={(e) => setSelectedFaq(e.target.value)}
          className="w-full px-4 py-3 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium transition-all duration-200 shadow-sm text-gray-700"
          style={{ 
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            background: 'white url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23666\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e") no-repeat',
            backgroundPosition: 'right 12px center',
            backgroundSize: '16px'
          }}
        >
          {faqData.map((item, index) => (
            <option key={item.id} value={item.id}>
              {index + 1}. {item.question}
            </option>
          ))}
        </select>
      </div>

      {selectedItem && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-xl font-semibold mb-4 font-orbitron" style={{ color: COLORS.primary }}>
            {selectedItem.question}
          </h3>
          <div className="text-gray-700 leading-relaxed font-orbitron">
            {selectedItem.answer}
          </div>
        </div>
      )}
    </div>
  );
};
