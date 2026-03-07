import type { FullCourse } from '../courseContent';

export const cybersecurityFundamentals: FullCourse = {
  id: 'cybersecurity-fundamentals',
  instructorName: 'Marcus Williams',
  instructorBio: 'Cybersecurity professional with 15+ years in threat intelligence and security operations. CISSP and CEH certified.',
  learningOutcomes: [
    'Identify common cyber threats and attack vectors targeting organizations',
    'Implement network security controls and defense-in-depth strategies',
    'Understand cryptographic principles and their real-world applications',
    'Develop risk management and incident response strategies',
  ],
  modules: [
    // ── Module 1: Threat Landscape ──────────────────────────────────────
    {
      id: 'cybersecurity-fundamentals__m1',
      title: 'Threat Landscape',
      description: 'Understand the modern cyber threat landscape including threat actors, attack vectors, and common malware types.',
      lessons: [
        {
          id: 'cybersecurity-fundamentals__m1__l1',
          title: 'Understanding Cyber Threats',
          objectives: [
            'Define cybersecurity and explain why it matters',
            'Identify the main categories of threat actors',
            'Describe the cyber kill chain methodology',
          ],
          estimatedMinutes: 25,
          keyTakeaways: [
            'Cybersecurity protects systems, networks, and data from digital attacks',
            'Threat actors range from script kiddies to nation-state groups with different motivations',
            'The cyber kill chain provides a framework for understanding attack stages',
          ],
          content: `## Understanding Cyber Threats

Cybersecurity is the practice of protecting systems, networks, programs, and data from digital attacks. These attacks typically aim to access, change, or destroy sensitive information, extort money from users, or disrupt normal business operations.

### Why Cybersecurity Matters

The digital transformation of business has created an ever-expanding attack surface. Consider these realities:

- **Data is the new currency** -- Organizations store vast amounts of sensitive data including customer records, financial information, intellectual property, and trade secrets. A single breach can expose millions of records.
- **Connectivity increases risk** -- The average enterprise now connects thousands of devices to its network, including IoT sensors, mobile devices, and cloud services. Each connection is a potential entry point.
- **Attacks are increasing** -- Cybercrime is projected to cost the world trillions annually. Ransomware attacks alone increased by over 100% in recent years.
- **Regulations demand it** -- Laws like GDPR, HIPAA, and PCI DSS require organizations to implement specific security controls or face significant fines.

### Types of Threat Actors

Not all attackers are the same. Understanding who might target your organization helps you prioritize defenses:

**Script Kiddies** are unskilled individuals who use pre-built tools and scripts to launch attacks. They typically lack deep technical knowledge but can still cause damage using widely available exploit kits. Their motivation is often curiosity or bragging rights.

**Hacktivists** are motivated by political or social causes. Groups like Anonymous have targeted organizations they view as unethical. Their attacks often involve website defacement or data leaks to embarrass their targets.

**Cybercriminals** are financially motivated and operate increasingly like businesses. They may use ransomware, business email compromise (BEC), or credit card skimming. Some criminal organizations have help desks, HR departments, and sophisticated supply chains.

**Insider Threats** come from within the organization -- disgruntled employees, careless contractors, or compromised accounts. Insiders already have legitimate access, making their actions harder to detect. Studies show insider threats account for roughly 30% of data breaches.

**Nation-State Actors** are government-sponsored groups with significant resources and advanced capabilities. They conduct espionage, sabotage, and influence operations. Examples include APT28 (Russia), APT41 (China), and Lazarus Group (North Korea). These attackers can persist in networks for months or years undetected.

**Advanced Persistent Threats (APTs)** specifically refer to prolonged, targeted attacks where an intruder gains access and remains undetected for an extended period. The goal is typically data exfiltration rather than immediate damage.

### The Cyber Kill Chain

Developed by Lockheed Martin, the **Cyber Kill Chain** is a framework that describes the stages of a cyberattack:

1. **Reconnaissance** -- The attacker researches the target, gathering information from public sources (OSINT), social media, DNS records, and job postings to find potential entry points.
2. **Weaponization** -- The attacker creates a deliverable payload, such as coupling an exploit with a backdoor into a deliverable package like a malicious PDF or Office document.
3. **Delivery** -- The weapon is transmitted to the target via email attachments, malicious websites, USB drives, or other vectors.
4. **Exploitation** -- The weapon's code triggers, exploiting a vulnerability on the target system to execute code.
5. **Installation** -- The exploit installs malware (backdoor, RAT, etc.) on the target system, establishing persistence.
6. **Command and Control (C2)** -- The malware establishes a channel back to the attacker's infrastructure, allowing remote control of the compromised system.
7. **Actions on Objectives** -- The attacker achieves their goal: data exfiltration, data destruction, encryption for ransom, or lateral movement to other systems.

Understanding this chain helps defenders implement controls at each stage to detect or prevent attacks before they succeed.

### The MITRE ATT&CK Framework

While the kill chain provides a high-level view, the **MITRE ATT&CK** (Adversarial Tactics, Techniques, and Common Knowledge) framework offers a more detailed, community-driven knowledge base of adversary behavior. It catalogs specific tactics (the "why") and techniques (the "how") that attackers use, mapped to real-world observations. Security teams use ATT&CK to evaluate their detection coverage and identify gaps.`,
        },
        {
          id: 'cybersecurity-fundamentals__m1__l2',
          title: 'Malware Types and Behaviors',
          objectives: [
            'Classify different types of malware by behavior and payload',
            'Explain how malware propagates through systems and networks',
            'Describe indicators of compromise (IOCs) for common malware',
          ],
          estimatedMinutes: 25,
          keyTakeaways: [
            'Malware includes viruses, worms, trojans, ransomware, spyware, and rootkits',
            'Modern malware often combines multiple techniques and evades detection',
            'Understanding malware behavior helps in detection and incident response',
          ],
          content: `## Malware Types and Behaviors

**Malware** (malicious software) is any software intentionally designed to cause damage to a computer, server, client, or network. Understanding the different types helps security professionals identify threats and implement appropriate countermeasures.

### Viruses

A **virus** is malicious code that attaches itself to a legitimate program or file and requires user action to execute. Key characteristics:

- **Requires a host** -- A virus cannot run independently; it must attach to an executable file, document macro, or boot sector.
- **Requires user action** -- The infected file must be opened, run, or the system must boot from an infected drive.
- **Self-replicating** -- Once executed, the virus copies itself to other files or programs on the system.

Common virus types include file infectors (attach to .exe files), macro viruses (embed in Office documents), and boot sector viruses (infect the master boot record).

### Worms

Unlike viruses, **worms** are standalone malware that self-replicate and spread across networks without requiring user interaction or a host file. They exploit vulnerabilities in operating systems or applications to propagate automatically.

Famous examples include:
- **WannaCry (2017)** -- Exploited the EternalBlue SMB vulnerability to spread across networks, encrypting files and demanding Bitcoin ransom. It affected over 200,000 computers across 150 countries in a single weekend.
- **Conficker (2008)** -- Exploited a Windows vulnerability and infected millions of computers, creating a massive botnet.
- **Stuxnet (2010)** -- A sophisticated worm targeting Iranian nuclear centrifuges, widely attributed to a nation-state operation.

### Trojans

A **Trojan horse** disguises itself as legitimate software to trick users into installing it. Unlike viruses and worms, Trojans do not self-replicate. Types include:

- **Remote Access Trojans (RATs)** -- Give attackers remote control of the victim's system, enabling file access, screen capture, keystroke logging, and camera/microphone activation.
- **Banking Trojans** -- Specifically designed to steal financial credentials by intercepting banking sessions, injecting fake forms, or redirecting transactions.
- **Downloader Trojans** -- Their primary purpose is to download and install additional malware once they've established a foothold.

### Ransomware

**Ransomware** encrypts victims' files and demands payment (usually in cryptocurrency) for the decryption key. It has become one of the most profitable attack types:

- **Crypto ransomware** encrypts files, making them inaccessible without the decryption key.
- **Locker ransomware** locks victims out of their entire system.
- **Double extortion** -- Attackers exfiltrate data before encryption and threaten to publish it if the ransom isn't paid.
- **Ransomware-as-a-Service (RaaS)** -- Criminal groups develop ransomware platforms and rent them to affiliates, who carry out attacks and split the profits.

### Spyware and Adware

**Spyware** secretly monitors user activity and collects information without consent. It can capture keystrokes, take screenshots, monitor browsing habits, and harvest credentials. **Keyloggers** are a specific type that record every keystroke, capturing passwords and sensitive data.

**Adware** displays unwanted advertisements and may track browsing behavior. While less dangerous than other malware, it can degrade performance and serve as a vector for more malicious payloads.

### Rootkits

A **rootkit** is designed to hide the presence of malware on a system. It modifies the operating system to conceal files, processes, network connections, and registry entries. Rootkits can operate at various levels:

- **User-mode rootkits** modify application-level binaries.
- **Kernel-mode rootkits** modify the OS kernel, making them extremely difficult to detect.
- **Bootkits** infect the boot process, loading before the operating system.

### Fileless Malware

**Fileless malware** operates entirely in memory, never writing files to disk. It leverages legitimate system tools like PowerShell, WMI, or Windows Management Instrumentation to execute malicious commands. Because it leaves no files to scan, traditional antivirus solutions struggle to detect it.

### Indicators of Compromise (IOCs)

IOCs are forensic artifacts that indicate a potential intrusion:

- **File-based IOCs**: Malicious file hashes (MD5, SHA-256), suspicious file names, unexpected executables
- **Network IOCs**: Known malicious IP addresses, unusual DNS queries, unexpected outbound connections, C2 beacon patterns
- **Host IOCs**: Suspicious registry modifications, unexpected scheduled tasks, unusual process behavior, modified system files
- **Behavioral IOCs**: Unusual login times, privilege escalation attempts, lateral movement patterns, data exfiltration indicators`,
        },
        {
          id: 'cybersecurity-fundamentals__m1__l3',
          title: 'Social Engineering and Phishing',
          objectives: [
            'Explain social engineering tactics and psychological manipulation techniques',
            'Identify different types of phishing attacks',
            'Describe defenses against social engineering',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'Social engineering exploits human psychology rather than technical vulnerabilities',
            'Phishing attacks range from mass campaigns to highly targeted spear phishing',
            'Security awareness training is the primary defense against social engineering',
          ],
          content: `## Social Engineering and Phishing

**Social engineering** is the art of manipulating people into divulging confidential information or performing actions that compromise security. It exploits human psychology rather than technical vulnerabilities, making it one of the most effective attack vectors.

### Principles of Social Engineering

Attackers leverage several psychological principles:

- **Authority** -- People tend to comply with requests from perceived authority figures. An attacker might impersonate a CEO, IT administrator, or law enforcement officer.
- **Urgency** -- Creating a sense of urgency pressures victims to act quickly without thinking critically. "Your account will be locked in 24 hours" is a classic urgency tactic.
- **Social Proof** -- People follow the actions of others. "Everyone in your department has already completed this form" encourages compliance.
- **Reciprocity** -- When someone does something for us, we feel obligated to return the favor. An attacker might offer help before making a request.
- **Scarcity** -- Limited availability increases perceived value. "Only the first 50 respondents will receive the bonus" motivates quick action.
- **Familiarity/Liking** -- We're more likely to comply with requests from people we like or who seem similar to us.

### Types of Phishing

**Email Phishing** is the most common form. Attackers send emails that appear to come from legitimate sources (banks, vendors, colleagues) containing malicious links or attachments. Mass phishing campaigns cast a wide net, hoping a percentage of recipients will click.

**Spear Phishing** targets specific individuals or organizations. The attacker researches the target and crafts personalized messages that reference real projects, colleagues, or events. These are much more convincing than generic phishing emails.

**Whaling** targets high-level executives (the "big fish"). These attacks are highly customized and may impersonate board members, legal counsel, or business partners. A successful whale phishing attack can result in large wire transfers or exposure of sensitive corporate data.

**Smishing** (SMS phishing) uses text messages to deliver malicious links or request sensitive information. "Your package delivery failed -- click here to reschedule" is a common smishing template.

**Vishing** (voice phishing) uses phone calls to impersonate legitimate organizations. Attackers may spoof caller ID to appear as a bank, government agency, or tech support. They use urgency and authority to pressure victims into revealing information.

**Business Email Compromise (BEC)** is a sophisticated attack where adversaries compromise or impersonate a business email account. Common scenarios include:
- **CEO Fraud** -- An attacker impersonates the CEO and emails the finance department requesting an urgent wire transfer.
- **Vendor Impersonation** -- The attacker poses as a known vendor with updated payment information.
- **Account Compromise** -- An employee's actual email account is compromised and used to request payments from customers.

### Recognizing Phishing Attempts

Train users to look for these red flags:

- **Suspicious sender address** -- The display name may look legitimate, but the actual email address is different (e.g., support@amaz0n-security.com)
- **Generic greetings** -- "Dear Customer" instead of your actual name
- **Grammatical errors** -- While improving, many phishing emails still contain spelling and grammar mistakes
- **Urgent calls to action** -- Threats of account closure, legal action, or missed deliveries
- **Suspicious links** -- Hovering over links reveals the actual URL, which may not match the displayed text
- **Unexpected attachments** -- Especially .exe, .scr, .zip files, or Office documents with macros

### Defenses Against Social Engineering

**Security Awareness Training** is the most critical defense. Regular training should include simulated phishing exercises, real-world examples, and clear reporting procedures. Users who fall for simulated attacks receive additional training.

**Technical Controls** complement training:
- Email filtering and anti-phishing gateways
- DMARC, DKIM, and SPF email authentication
- Multi-factor authentication (prevents credential reuse even if phished)
- URL filtering and web proxies
- Data Loss Prevention (DLP) tools

**Organizational Policies** create a security-conscious culture:
- Verification procedures for financial transactions (call-back verification)
- Clean desk policies
- Visitor management procedures
- Incident reporting without blame`,
        },
        {
          id: 'cybersecurity-fundamentals__m1__l4',
          title: 'Vulnerability Management',
          objectives: [
            'Explain the vulnerability lifecycle from discovery to remediation',
            'Describe common vulnerability scoring systems',
            'Outline a vulnerability management program',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'Vulnerabilities are weaknesses that can be exploited by threats',
            'CVSS provides a standardized way to assess vulnerability severity',
            'Effective vulnerability management requires continuous scanning, prioritization, and remediation',
          ],
          content: `## Vulnerability Management

A **vulnerability** is a weakness in a system, application, or process that can be exploited by a threat to gain unauthorized access or cause harm. Vulnerability management is the systematic process of identifying, evaluating, treating, and reporting on security vulnerabilities.

### The Vulnerability Lifecycle

1. **Discovery** -- A vulnerability is found through security research, penetration testing, bug bounty programs, or in-the-wild exploitation. The discoverer may be a security researcher, the software vendor, or a malicious actor.

2. **Disclosure** -- Responsible disclosure involves notifying the vendor privately and allowing time to develop a patch before public announcement. The standard timeline is typically 90 days. Some researchers practice full disclosure (immediate public release) if vendors are unresponsive.

3. **CVE Assignment** -- The vulnerability receives a **Common Vulnerabilities and Exposures (CVE)** identifier (e.g., CVE-2024-12345), providing a standardized reference. The CVE system is maintained by MITRE Corporation.

4. **Patch Development** -- The vendor develops and tests a fix. This process varies from days to months depending on complexity.

5. **Patch Release** -- The vendor releases the patch, often accompanied by a security advisory detailing the vulnerability, affected versions, and remediation steps.

6. **Remediation** -- Organizations apply the patch to affected systems. This involves testing, scheduling maintenance windows, and deploying updates across the environment.

### Zero-Day Vulnerabilities

A **zero-day** vulnerability is one that is exploited before the vendor is aware of it or has released a patch. The term "zero-day" refers to the fact that developers have had zero days to fix the issue. Zero-days are highly valuable -- they can sell for hundreds of thousands of dollars on both legitimate (bug bounty) and black markets.

### CVSS -- Common Vulnerability Scoring System

**CVSS** provides a standardized way to capture the characteristics of a vulnerability and produce a numerical score (0-10) reflecting its severity:

- **None**: 0.0
- **Low**: 0.1 - 3.9
- **Medium**: 4.0 - 6.9
- **High**: 7.0 - 8.9
- **Critical**: 9.0 - 10.0

The score considers factors like:
- **Attack Vector** -- Network, Adjacent, Local, or Physical access required
- **Attack Complexity** -- High or Low
- **Privileges Required** -- None, Low, or High
- **User Interaction** -- None or Required
- **Impact** -- Effect on Confidentiality, Integrity, and Availability

### Building a Vulnerability Management Program

**Asset Inventory** -- You cannot protect what you don't know about. Maintain a comprehensive inventory of all hardware, software, and cloud resources. Classify assets by criticality to the business.

**Vulnerability Scanning** -- Use automated scanners (Nessus, Qualys, OpenVAS) to regularly scan your environment. Schedule scans to minimize business disruption:
- External scans: At least monthly for internet-facing systems
- Internal scans: At least quarterly for internal systems
- After significant changes: New deployments, configuration changes, or new vulnerability disclosures

**Prioritization** -- Not all vulnerabilities need immediate attention. Prioritize based on:
- CVSS score and exploitability
- Asset criticality and exposure
- Threat intelligence (is this vulnerability being actively exploited?)
- Compensating controls already in place

**Remediation** -- Apply patches, update configurations, or implement compensating controls. Track remediation progress with defined SLAs:
- Critical vulnerabilities: 24-48 hours
- High vulnerabilities: 7-14 days
- Medium vulnerabilities: 30 days
- Low vulnerabilities: 90 days

**Verification** -- Rescan after remediation to confirm the vulnerability is resolved. Document exceptions for vulnerabilities that cannot be remediated immediately.

**Reporting** -- Provide regular reports to stakeholders showing vulnerability trends, remediation rates, and risk posture. Executive dashboards should highlight critical risks and progress.

### Patch Management Best Practices

- Maintain a test environment that mirrors production
- Test patches before deploying to production
- Use automated patch management tools (WSUS, SCCM, Ansible)
- Schedule regular maintenance windows
- Have a rollback plan for every patch deployment
- Prioritize internet-facing and critical systems`,
        },
      ],
      quiz: [
        {
          id: 'cybersecurity-fundamentals__m1__q1',
          question: 'Which threat actor is MOST likely to conduct prolonged espionage campaigns against government agencies?',
          options: ['Script kiddies', 'Hacktivists', 'Nation-state actors', 'Insider threats'],
          correctIndex: 2,
          explanation: 'Nation-state actors are government-sponsored groups with significant resources and advanced capabilities, making them the most likely to conduct prolonged espionage campaigns against other governments.',
        },
        {
          id: 'cybersecurity-fundamentals__m1__q2',
          question: 'What is the correct order of the first three stages of the Cyber Kill Chain?',
          options: [
            'Delivery, Weaponization, Reconnaissance',
            'Reconnaissance, Weaponization, Delivery',
            'Weaponization, Delivery, Exploitation',
            'Reconnaissance, Delivery, Exploitation',
          ],
          correctIndex: 1,
          explanation: 'The Cyber Kill Chain begins with Reconnaissance (gathering information), followed by Weaponization (creating the attack payload), then Delivery (transmitting it to the target).',
        },
        {
          id: 'cybersecurity-fundamentals__m1__q3',
          question: 'Which type of malware can spread across networks without user interaction?',
          options: ['Virus', 'Trojan', 'Worm', 'Adware'],
          correctIndex: 2,
          explanation: 'Worms are standalone malware that self-replicate and spread across networks by exploiting vulnerabilities, without requiring user interaction or a host file.',
        },
        {
          id: 'cybersecurity-fundamentals__m1__q4',
          question: 'What distinguishes spear phishing from regular phishing?',
          options: [
            'It uses phone calls instead of emails',
            'It targets specific individuals with personalized messages',
            'It only targets mobile devices',
            'It uses encrypted attachments',
          ],
          correctIndex: 1,
          explanation: 'Spear phishing is a targeted form of phishing where attackers research specific individuals and craft personalized messages, making them more convincing than generic mass phishing campaigns.',
        },
        {
          id: 'cybersecurity-fundamentals__m1__q5',
          question: 'A vulnerability with a CVSS score of 9.2 would be classified as:',
          options: ['High', 'Critical', 'Medium', 'Severe'],
          correctIndex: 1,
          explanation: 'CVSS scores of 9.0-10.0 are classified as Critical. High is 7.0-8.9, Medium is 4.0-6.9, and Low is 0.1-3.9.',
        },
        {
          id: 'cybersecurity-fundamentals__m1__q6',
          question: 'What is a zero-day vulnerability?',
          options: [
            'A vulnerability that has been patched within zero days',
            'A vulnerability exploited before the vendor knows about it or has a patch',
            'A vulnerability with a CVSS score of zero',
            'A vulnerability that only exists for one day',
          ],
          correctIndex: 1,
          explanation: 'A zero-day vulnerability is one that is exploited before the vendor is aware of it or has released a patch. The name refers to the vendor having had zero days to fix the issue.',
        },
      ],
    },

    // ── Module 2: Network Security ──────────────────────────────────────
    {
      id: 'cybersecurity-fundamentals__m2',
      title: 'Network Security',
      description: 'Learn essential network security concepts including firewalls, IDS/IPS, VPNs, and network segmentation strategies.',
      lessons: [
        {
          id: 'cybersecurity-fundamentals__m2__l1',
          title: 'Firewalls and Access Control',
          objectives: [
            'Explain how firewalls control network traffic',
            'Compare different types of firewalls',
            'Design basic firewall rules and policies',
          ],
          estimatedMinutes: 25,
          keyTakeaways: [
            'Firewalls are the first line of defense in network security',
            'Next-generation firewalls combine traditional filtering with deep packet inspection and application awareness',
            'Firewall rules should follow the principle of least privilege -- deny by default, allow by exception',
          ],
          content: `## Firewalls and Access Control

A **firewall** is a network security device that monitors and controls incoming and outgoing network traffic based on predetermined security rules. It establishes a barrier between trusted internal networks and untrusted external networks like the Internet.

### How Firewalls Work

At their core, firewalls examine network packets and decide whether to allow or block them based on a set of rules (also called an Access Control List or ACL). Each rule typically specifies:

- **Source IP address or range**
- **Destination IP address or range**
- **Protocol** (TCP, UDP, ICMP)
- **Port number** (80 for HTTP, 443 for HTTPS, 22 for SSH, etc.)
- **Action** (Allow, Deny, Drop, Log)

Rules are processed in order from top to bottom. The first matching rule is applied, and subsequent rules are not evaluated for that packet. The last rule is typically a **default deny** -- if no rule matches, the traffic is blocked.

### Types of Firewalls

**Packet Filtering Firewalls** are the simplest type. They examine individual packets in isolation, checking source/destination addresses, ports, and protocols against the rule set. They are fast but cannot detect attacks that span multiple packets or understand application-level protocols.

**Stateful Inspection Firewalls** track the state of network connections. They maintain a state table of active connections and evaluate packets in the context of their connection. For example, a stateful firewall knows that an incoming packet is part of a response to an outgoing request and allows it through. This provides better security than packet filtering.

**Application Layer Firewalls (Proxy Firewalls)** operate at Layer 7 of the OSI model. They understand application protocols (HTTP, FTP, DNS) and can make decisions based on the content of the traffic, not just headers. A proxy firewall can block specific web requests, detect malicious file uploads, or enforce content policies.

**Next-Generation Firewalls (NGFWs)** combine traditional firewall capabilities with advanced features:
- **Deep Packet Inspection (DPI)** -- Examines the data portion of packets, not just headers
- **Intrusion Prevention System (IPS)** -- Built-in signature and anomaly-based detection
- **Application Awareness** -- Identifies and controls applications regardless of port (e.g., detecting Skype on port 443)
- **SSL/TLS Inspection** -- Decrypts and inspects encrypted traffic
- **Threat Intelligence Integration** -- Automatically updates rules based on known threats
- **User Identity Awareness** -- Maps traffic to specific users, not just IP addresses

### Firewall Deployment Strategies

**Perimeter Firewall** sits between the internal network and the Internet. It's the traditional "castle wall" approach and remains essential, but is insufficient on its own.

**DMZ (Demilitarized Zone)** is a network segment that sits between the internal network and the Internet, hosting public-facing services (web servers, email servers). A dual-firewall DMZ uses one firewall between the Internet and DMZ, and another between the DMZ and internal network.

**Internal Firewalls** segment the internal network to limit lateral movement. If an attacker breaches the perimeter, internal firewalls prevent them from accessing all network segments.

**Host-Based Firewalls** run on individual computers (Windows Firewall, iptables on Linux). They provide an additional layer of defense even when the network firewall is bypassed.

### Firewall Best Practices

- **Default deny** -- Block everything and only allow what's needed
- **Least privilege** -- Only open ports and protocols required for business operations
- **Regular rule review** -- Remove outdated rules, document the purpose of each rule
- **Log everything** -- Enable logging for both allowed and denied traffic
- **Change management** -- Document and approve all firewall changes
- **Regular testing** -- Verify rules work as intended using port scanning tools`,
        },
        {
          id: 'cybersecurity-fundamentals__m2__l2',
          title: 'Intrusion Detection and Prevention Systems',
          objectives: [
            'Differentiate between IDS and IPS and their deployment modes',
            'Explain signature-based and anomaly-based detection methods',
            'Describe common IDS/IPS evasion techniques',
          ],
          estimatedMinutes: 25,
          keyTakeaways: [
            'IDS monitors and alerts while IPS actively blocks malicious traffic',
            'Signature-based detection catches known threats; anomaly-based detection can identify novel attacks',
            'Proper tuning reduces false positives and improves detection accuracy',
          ],
          content: `## Intrusion Detection and Prevention Systems

**Intrusion Detection Systems (IDS)** and **Intrusion Prevention Systems (IPS)** are security tools that monitor network traffic or system activity for malicious behavior or policy violations.

### IDS vs. IPS

**IDS** operates in a passive mode -- it monitors traffic, detects suspicious activity, and generates alerts for security analysts to review. It does NOT block traffic. Think of it as a security camera that records events.

**IPS** operates inline (directly in the network path) and can actively block or prevent malicious traffic in real-time. Think of it as a security guard who can stop intruders at the door.

Many modern solutions combine both functions, operating as IDS/IPS systems that can be configured to alert only, block automatically, or a combination based on confidence levels.

### Deployment Modes

**Network-Based IDS/IPS (NIDS/NIPS)** monitors network traffic by analyzing packets flowing through network segments. Sensors are placed at strategic points -- network perimeters, between segments, or monitoring switch SPAN/mirror ports.

**Host-Based IDS/IPS (HIDS/HIPS)** runs on individual hosts and monitors system activity including file changes, process execution, registry modifications, and log entries. Examples include OSSEC and Wazuh.

### Detection Methods

**Signature-Based Detection** compares observed activity against a database of known attack patterns (signatures). Like antivirus software, it's excellent at detecting known threats with very low false positive rates. However, it cannot detect new or modified attacks that don't match existing signatures. Signature databases must be regularly updated.

**Anomaly-Based Detection** establishes a baseline of "normal" network or system behavior and alerts when activity deviates significantly from this baseline. It can detect novel attacks (zero-days) that signature-based systems miss. The downside is a higher false positive rate, especially during the initial learning period or when legitimate usage patterns change.

**Heuristic/Behavioral Detection** analyzes the behavior of code or network traffic rather than matching signatures. It evaluates factors like the sequence of system calls, network communication patterns, and resource usage. This approach falls between signature and anomaly detection in terms of accuracy and false positive rates.

### Popular IDS/IPS Solutions

- **Snort** -- Open-source NIDS/NIPS with a vast community-maintained rule set. Industry standard for many years.
- **Suricata** -- Open-source IDS/IPS with multi-threading support and protocol identification capabilities. Can analyze HTTP, TLS, SMB, and other protocols.
- **Zeek (formerly Bro)** -- Network analysis framework that provides detailed logs of network activity. Excellent for forensics and network monitoring.
- **OSSEC/Wazuh** -- Open-source HIDS with log analysis, file integrity monitoring, and rootkit detection.

### Reducing False Positives

False positives -- alerts triggered by legitimate activity -- are the biggest operational challenge for IDS/IPS systems. Excessive false positives lead to alert fatigue, where analysts begin ignoring alerts, potentially missing real attacks.

Strategies to reduce false positives:
- **Tune signatures** -- Disable signatures for services you don't run, adjust thresholds
- **Whitelist known-good traffic** -- Exclude trusted sources and normal behavior patterns
- **Use contextual information** -- Correlate alerts with asset inventory (don't alert on Windows exploits targeting Linux servers)
- **Layer detection methods** -- Combine signature and anomaly detection for higher confidence
- **Regular review** -- Continuously refine rules based on analyst feedback`,
        },
        {
          id: 'cybersecurity-fundamentals__m2__l3',
          title: 'VPNs and Secure Remote Access',
          objectives: [
            'Explain how VPN technology creates secure tunnels over public networks',
            'Compare site-to-site and remote access VPN architectures',
            'Describe VPN protocols and their security properties',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'VPNs encrypt traffic to create secure communication channels over untrusted networks',
            'IPSec and SSL/TLS are the two primary VPN protocol families',
            'Zero Trust Network Access is emerging as a modern alternative to traditional VPNs',
          ],
          content: `## VPNs and Secure Remote Access

A **Virtual Private Network (VPN)** creates an encrypted tunnel between two points over a public network (typically the Internet), allowing secure communication as if the devices were on the same private network.

### How VPNs Work

VPN technology provides three core security services:

1. **Confidentiality** -- Encryption ensures that even if traffic is intercepted, it cannot be read. Data is encrypted before entering the tunnel and decrypted at the other end.
2. **Integrity** -- Hash functions verify that data hasn't been modified in transit. If a packet is altered, the hash check fails and the packet is discarded.
3. **Authentication** -- Both ends of the tunnel verify each other's identity using certificates, pre-shared keys, or user credentials.

### VPN Types

**Remote Access VPN** connects individual users to a corporate network. Employees working from home, traveling, or at coffee shops use a VPN client to establish an encrypted tunnel to the corporate VPN gateway. Once connected, they can access internal resources as if they were in the office.

**Site-to-Site VPN** connects two networks together permanently. For example, a company's headquarters and branch offices can be linked via site-to-site VPN, allowing all users at both locations to communicate securely. This is transparent to end users -- they don't need to install or launch any VPN software.

**Client-to-Site vs. Clientless VPN** -- Traditional VPNs require installing client software. Clientless VPNs (SSL VPN portals) allow access through a web browser, providing access to specific web applications without installing anything.

### VPN Protocols

**IPSec (Internet Protocol Security)** is a suite of protocols that provides security at the network layer (Layer 3). It consists of:
- **AH (Authentication Header)** -- Provides integrity and authentication but not encryption
- **ESP (Encapsulating Security Payload)** -- Provides encryption, integrity, and authentication
- **IKE (Internet Key Exchange)** -- Negotiates security associations and exchanges keys

IPSec operates in two modes:
- **Transport Mode** -- Encrypts only the payload, leaving the original IP header intact. Used for host-to-host communication.
- **Tunnel Mode** -- Encrypts the entire original packet and encapsulates it in a new IP packet. Used for site-to-site VPNs.

**SSL/TLS VPN** operates at the transport/application layer and uses the same encryption protocols as HTTPS. Advantages include:
- Works through most firewalls (uses port 443)
- Can be clientless (web browser-based)
- Granular access control (can limit access to specific applications)
- Easier to deploy than IPSec

**WireGuard** is a modern VPN protocol designed for simplicity and performance. It uses state-of-the-art cryptography, has a much smaller codebase than IPSec or OpenVPN, and provides excellent performance.

**OpenVPN** is an open-source SSL/TLS-based VPN solution widely used for both remote access and site-to-site connections. It's highly configurable and runs on all major platforms.

### Zero Trust Network Access (ZTNA)

Traditional VPNs grant broad network access once connected -- if you're on the VPN, you can typically reach most internal resources. **Zero Trust Network Access (ZTNA)** takes a different approach:

- **Never trust, always verify** -- Every access request is authenticated and authorized regardless of location
- **Least privilege access** -- Users only get access to the specific applications they need, not the entire network
- **Continuous verification** -- Access is re-evaluated continuously, not just at connection time
- **Identity-centric** -- Access decisions are based on user identity, device health, and context rather than network location

ZTNA solutions like Zscaler Private Access, Cloudflare Access, and Google BeyondCorp are increasingly replacing traditional VPNs, especially for organizations with distributed workforces.`,
        },
        {
          id: 'cybersecurity-fundamentals__m2__l4',
          title: 'Network Segmentation and Architecture',
          objectives: [
            'Explain the security benefits of network segmentation',
            'Design a segmented network architecture',
            'Describe microsegmentation and software-defined networking concepts',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'Network segmentation limits the blast radius of security breaches',
            'VLANs, subnets, and firewalls are fundamental segmentation tools',
            'Microsegmentation provides granular control at the workload level',
          ],
          content: `## Network Segmentation and Architecture

**Network segmentation** divides a network into smaller, isolated segments to improve security and performance. Instead of one large flat network where any device can communicate with any other device, segmentation creates boundaries that control traffic flow.

### Why Segment?

Without segmentation, if an attacker compromises one system, they can potentially reach every other system on the network. This is known as **lateral movement** -- one of the most dangerous phases of an attack. Segmentation provides:

- **Reduced attack surface** -- Attackers can only reach systems within the compromised segment
- **Containment** -- Breaches are contained to a smaller area, limiting damage
- **Compliance** -- Regulations like PCI DSS require isolating systems that handle sensitive data
- **Performance** -- Reducing broadcast domains improves network performance
- **Access control** -- Different segments can have different security policies

### Segmentation Methods

**VLANs (Virtual Local Area Networks)** logically separate devices on the same physical network into different broadcast domains. A device on VLAN 10 cannot communicate directly with a device on VLAN 20 without going through a router or Layer 3 switch with access control rules.

Common VLAN segmentation:
- **User VLAN** -- Employee workstations
- **Server VLAN** -- Internal servers
- **Management VLAN** -- Network device management interfaces
- **Guest VLAN** -- Visitor and guest devices
- **IoT VLAN** -- Internet of Things devices (cameras, sensors)
- **VoIP VLAN** -- IP phones and voice traffic

**Subnets** divide networks at Layer 3 using IP addressing. Each subnet has its own address range, and routers with ACLs control traffic between subnets.

**DMZ (Demilitarized Zone)** is a specialized segment for public-facing services. Web servers, email gateways, and DNS servers sit in the DMZ, accessible from the Internet but isolated from the internal network. If a DMZ server is compromised, the attacker still can't directly access internal systems.

### Defense in Depth Architecture

**Defense in depth** applies multiple layers of security controls throughout the network:

1. **Perimeter Layer** -- External firewalls, IDS/IPS, DDoS protection
2. **Network Layer** -- Internal firewalls, VLANs, network access control (NAC)
3. **Host Layer** -- Endpoint protection, host-based firewalls, patch management
4. **Application Layer** -- Web application firewalls, input validation, authentication
5. **Data Layer** -- Encryption, access controls, data loss prevention, backups

If one layer fails, the next layer provides protection. No single control is relied upon exclusively.

### Microsegmentation

**Microsegmentation** takes segmentation to the workload level. Instead of segmenting by network zones, microsegmentation creates security policies around individual workloads (virtual machines, containers, or applications).

In a microsegmented environment:
- A web server can only communicate with its specific database server, not all databases
- An application server can reach its API endpoints but not other applications' servers
- Each workload has its own security perimeter

This is especially important in cloud and virtualized environments where traditional network boundaries don't exist. Software-defined networking (SDN) and platforms like VMware NSX or cloud-native security groups enable microsegmentation.

### Network Access Control (NAC)

**NAC** enforces security policies on devices attempting to connect to the network:
- **Pre-admission** -- Checks device health before allowing network access (antivirus updated, patches applied, compliant configuration)
- **Post-admission** -- Monitors device behavior after connection and can quarantine devices that violate policies
- **802.1X** -- An IEEE standard for port-based network access control that requires authentication before granting network access

NAC ensures that only authorized, healthy devices connect to appropriate network segments.`,
        },
      ],
      quiz: [
        {
          id: 'cybersecurity-fundamentals__m2__q1',
          question: 'What is the primary difference between an IDS and an IPS?',
          options: [
            'IDS is hardware-based while IPS is software-based',
            'IDS monitors and alerts while IPS actively blocks malicious traffic',
            'IDS works on networks while IPS works on hosts',
            'IDS uses signatures while IPS uses anomaly detection',
          ],
          correctIndex: 1,
          explanation: 'The key difference is that an IDS passively monitors and generates alerts, while an IPS operates inline and can actively block or prevent malicious traffic in real-time.',
        },
        {
          id: 'cybersecurity-fundamentals__m2__q2',
          question: 'Which firewall type can make decisions based on application-level content?',
          options: [
            'Packet filtering firewall',
            'Stateful inspection firewall',
            'Next-generation firewall (NGFW)',
            'Circuit-level gateway',
          ],
          correctIndex: 2,
          explanation: 'Next-generation firewalls (NGFWs) combine traditional firewall capabilities with application awareness, deep packet inspection, and integrated IPS to make decisions based on application-level content.',
        },
        {
          id: 'cybersecurity-fundamentals__m2__q3',
          question: 'What does IPSec Tunnel Mode encrypt?',
          options: [
            'Only the payload',
            'Only the IP header',
            'The entire original packet including headers',
            'Only the authentication data',
          ],
          correctIndex: 2,
          explanation: 'IPSec Tunnel Mode encrypts the entire original packet (both header and payload) and encapsulates it in a new IP packet. This is used for site-to-site VPNs.',
        },
        {
          id: 'cybersecurity-fundamentals__m2__q4',
          question: 'Which technology divides a physical network into separate logical broadcast domains?',
          options: ['Subnetting', 'VLANs', 'NAT', 'DHCP'],
          correctIndex: 1,
          explanation: 'VLANs (Virtual Local Area Networks) logically separate devices on the same physical network into different broadcast domains, providing isolation without requiring separate physical infrastructure.',
        },
        {
          id: 'cybersecurity-fundamentals__m2__q5',
          question: 'What is the core principle of Zero Trust Network Access?',
          options: [
            'Trust internal network traffic, verify external traffic',
            'Never trust, always verify -- regardless of network location',
            'Trust devices that pass initial authentication',
            'Block all traffic by default with no exceptions',
          ],
          correctIndex: 1,
          explanation: 'Zero Trust operates on the principle of "never trust, always verify" -- every access request must be authenticated and authorized regardless of whether it originates from inside or outside the network.',
        },
        {
          id: 'cybersecurity-fundamentals__m2__q6',
          question: 'What is microsegmentation?',
          options: [
            'Dividing a network into very small subnets',
            'Creating security policies around individual workloads',
            'Using micro-firewalls on each device',
            'Segmenting traffic by packet size',
          ],
          correctIndex: 1,
          explanation: 'Microsegmentation creates security policies at the individual workload level (VMs, containers, applications), providing granular control that goes beyond traditional network segmentation.',
        },
      ],
    },

    // ── Module 3: Cryptography Basics ───────────────────────────────────
    {
      id: 'cybersecurity-fundamentals__m3',
      title: 'Cryptography Basics',
      description: 'Understand cryptographic concepts including symmetric and asymmetric encryption, hashing, digital signatures, and PKI.',
      lessons: [
        {
          id: 'cybersecurity-fundamentals__m3__l1',
          title: 'Symmetric and Asymmetric Encryption',
          objectives: [
            'Explain the difference between symmetric and asymmetric encryption',
            'Identify common encryption algorithms and their use cases',
            'Describe how hybrid encryption combines both approaches',
          ],
          estimatedMinutes: 25,
          keyTakeaways: [
            'Symmetric encryption uses one key for both encryption and decryption; asymmetric uses a key pair',
            'AES is the standard symmetric algorithm; RSA and ECC are common asymmetric algorithms',
            'Hybrid encryption uses asymmetric keys to exchange a symmetric session key',
          ],
          content: `## Symmetric and Asymmetric Encryption

**Cryptography** is the science of securing communications and data through mathematical algorithms. It provides confidentiality (keeping data secret), integrity (ensuring data hasn't been modified), authentication (verifying identity), and non-repudiation (preventing denial of actions).

### Symmetric Encryption

**Symmetric encryption** uses the same key for both encryption and decryption. The sender and receiver must both possess the shared secret key.

**Advantages:**
- Very fast -- can encrypt large amounts of data quickly
- Computationally efficient -- requires less processing power
- Simple to implement

**Disadvantages:**
- **Key distribution problem** -- How do you securely share the key with the other party? If you send it over the network, anyone intercepting it can decrypt your communications.
- **Key management at scale** -- In a network of N users, you need N(N-1)/2 unique keys for everyone to communicate securely. For 100 users, that's 4,950 keys.
- **No non-repudiation** -- Since both parties share the same key, you can't prove which party encrypted a message.

**Common Symmetric Algorithms:**

- **AES (Advanced Encryption Standard)** -- The gold standard for symmetric encryption. Adopted by NIST in 2001 to replace DES. Supports key sizes of 128, 192, and 256 bits. AES-256 is approved for protecting classified government information.
- **ChaCha20** -- A stream cipher designed as an alternative to AES. Used in TLS 1.3 and by Google for mobile encryption where hardware AES acceleration isn't available.
- **3DES (Triple DES)** -- Applies DES three times with different keys. Being phased out in favor of AES but still found in legacy systems.
- **DES (Data Encryption Standard)** -- An older 56-bit algorithm that is now considered insecure. It can be brute-forced in hours with modern hardware. Never use DES for new implementations.

**Block Ciphers vs. Stream Ciphers:**
- **Block ciphers** (AES, DES) encrypt fixed-size blocks of data (e.g., 128 bits at a time). Modes of operation like CBC, GCM, and CTR determine how blocks are chained together.
- **Stream ciphers** (ChaCha20, RC4) encrypt data one bit or byte at a time, making them suitable for streaming data. RC4 is now deprecated due to vulnerabilities.

### Asymmetric Encryption

**Asymmetric encryption** (public-key cryptography) uses a mathematically linked key pair:
- **Public key** -- Shared openly. Anyone can use it to encrypt messages or verify signatures.
- **Private key** -- Kept secret. Only the owner uses it to decrypt messages or create signatures.

Data encrypted with the public key can ONLY be decrypted with the corresponding private key, and vice versa.

**Advantages:**
- Solves the key distribution problem -- public keys can be shared freely
- Enables digital signatures and non-repudiation
- Scales better -- each user only needs one key pair

**Disadvantages:**
- Much slower than symmetric encryption (100-1000x slower)
- Larger key sizes required for equivalent security
- More computationally intensive

**Common Asymmetric Algorithms:**

- **RSA** -- The most widely used asymmetric algorithm, based on the difficulty of factoring large prime numbers. Common key sizes are 2048 and 4096 bits. Used for encryption, digital signatures, and key exchange.
- **ECC (Elliptic Curve Cryptography)** -- Provides equivalent security to RSA with much smaller key sizes. A 256-bit ECC key provides similar security to a 3072-bit RSA key. Increasingly preferred for mobile and IoT devices due to efficiency.
- **Diffie-Hellman (DH)** -- Not used for encryption directly, but for secure key exchange. Two parties can agree on a shared secret over an insecure channel without ever transmitting the secret itself.

### Hybrid Encryption

In practice, symmetric and asymmetric encryption are combined in **hybrid encryption**:

1. The sender generates a random symmetric session key
2. The sender encrypts the actual data with the fast symmetric algorithm (AES)
3. The sender encrypts the session key with the recipient's public key (RSA/ECC)
4. Both the encrypted data and encrypted session key are sent
5. The recipient decrypts the session key with their private key
6. The recipient uses the session key to decrypt the data

This approach gives you the speed of symmetric encryption with the key distribution advantage of asymmetric encryption. **TLS/HTTPS uses exactly this pattern** for every secure web connection.`,
        },
        {
          id: 'cybersecurity-fundamentals__m3__l2',
          title: 'Hashing and Digital Signatures',
          objectives: [
            'Explain hash functions and their security properties',
            'Describe how digital signatures provide authentication and non-repudiation',
            'Identify common hashing algorithms and their appropriate uses',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'Hash functions produce a fixed-size fingerprint that uniquely identifies data',
            'Digital signatures combine hashing with asymmetric encryption for authentication',
            'SHA-256 and SHA-3 are the recommended hashing algorithms; MD5 and SHA-1 are broken',
          ],
          content: `## Hashing and Digital Signatures

### Hash Functions

A **hash function** is a one-way mathematical function that takes input of any size and produces a fixed-size output (the hash, digest, or fingerprint). Key properties:

- **Deterministic** -- The same input always produces the same output
- **Fixed output size** -- Regardless of input size, the output is always the same length (e.g., SHA-256 always produces a 256-bit hash)
- **One-way** -- It's computationally infeasible to reverse the hash and recover the original input
- **Avalanche effect** -- A tiny change in input produces a completely different hash. Changing one character in a document produces an entirely different digest.
- **Collision resistance** -- It should be practically impossible to find two different inputs that produce the same hash output

### Common Hash Algorithms

**MD5 (Message Digest 5)** produces a 128-bit hash. It is **cryptographically broken** -- researchers have demonstrated practical collision attacks. Never use MD5 for security purposes, though it's still sometimes used for file integrity checksums in non-security contexts.

**SHA-1 (Secure Hash Algorithm 1)** produces a 160-bit hash. Also **broken** -- Google demonstrated a practical collision (SHAttered attack) in 2017. Deprecated by most standards and browsers.

**SHA-2 Family** includes SHA-224, SHA-256, SHA-384, and SHA-512. **SHA-256 is the current standard** for most security applications. No practical attacks have been demonstrated against SHA-2.

**SHA-3** is the newest member of the SHA family, based on a completely different algorithm (Keccak) than SHA-2. It serves as a backup in case vulnerabilities are found in SHA-2.

**bcrypt, scrypt, Argon2** are specialized hash functions designed for password hashing. Unlike general-purpose hashes, they are intentionally slow and include a "salt" (random data) to prevent rainbow table attacks. **Argon2** won the Password Hashing Competition and is the recommended choice for new applications.

### Uses of Hashing

- **Password storage** -- Servers store password hashes, not plaintext passwords. When a user logs in, the server hashes the entered password and compares it to the stored hash.
- **File integrity** -- Hash a file and compare later to detect modifications. Software downloads often include checksums for verification.
- **Digital signatures** -- Hash the message first, then sign the hash (much faster than signing the entire message).
- **Blockchain** -- Cryptocurrencies use chained hashes to create tamper-evident transaction records.

### Digital Signatures

A **digital signature** provides authentication (who sent it), integrity (it hasn't been modified), and non-repudiation (the sender can't deny sending it).

**How digital signatures work:**

1. **Signing**: The sender hashes the message using SHA-256, then encrypts the hash with their **private key**. The encrypted hash is the digital signature, which is attached to the original message.

2. **Verification**: The recipient decrypts the signature using the sender's **public key**, recovering the original hash. They independently hash the received message. If the two hashes match, the signature is valid -- the message hasn't been modified and was signed by the holder of the private key.

**Digital Signature Algorithms:**
- **RSA Signatures** -- Uses RSA key pairs for signing and verification
- **DSA (Digital Signature Algorithm)** -- Specifically designed for signatures (not encryption)
- **ECDSA (Elliptic Curve DSA)** -- DSA using elliptic curve cryptography for better efficiency
- **EdDSA (Edwards-curve DSA)** -- Modern, fast, and secure signature algorithm

### HMAC (Hash-based Message Authentication Code)

**HMAC** combines a hash function with a secret key to provide both integrity and authentication. Unlike digital signatures, HMAC uses symmetric keys, so both parties must share the secret. It's faster than digital signatures and commonly used in API authentication and session management.

The formula is: HMAC(key, message) = Hash((key XOR opad) || Hash((key XOR ipad) || message))

HMAC is widely used in protocols like TLS, IPSec, and JWT (JSON Web Tokens).`,
        },
        {
          id: 'cybersecurity-fundamentals__m3__l3',
          title: 'PKI and Certificate Management',
          objectives: [
            'Explain the role of Public Key Infrastructure in establishing trust',
            'Describe the components of a digital certificate',
            'Outline certificate lifecycle management processes',
          ],
          estimatedMinutes: 25,
          keyTakeaways: [
            'PKI provides the trust framework for verifying public key ownership',
            'Certificate Authorities issue, manage, and revoke digital certificates',
            'TLS/HTTPS relies on PKI to establish secure connections between browsers and servers',
          ],
          content: `## PKI and Certificate Management

### The Trust Problem

Asymmetric encryption relies on public keys, but how do you know a public key truly belongs to the claimed owner? If an attacker substitutes their public key for a legitimate one (a man-in-the-middle attack), they can intercept all encrypted communications.

**Public Key Infrastructure (PKI)** solves this by creating a trust framework that binds public keys to identities through **digital certificates** issued by trusted third parties.

### Components of PKI

**Certificate Authority (CA)** is the trusted entity that issues digital certificates. CAs verify the identity of certificate requestors before issuing certificates. Major CAs include DigiCert, Let's Encrypt, Sectigo, and GlobalSign.

CAs are organized in a hierarchy:
- **Root CA** -- The top of the trust chain. Root CA certificates are pre-installed in operating systems and browsers. Root CAs are kept offline for security.
- **Intermediate CA (Subordinate CA)** -- Issues certificates on behalf of the Root CA. If an intermediate CA is compromised, only its certificates are affected, not the entire root.

**Registration Authority (RA)** handles the identity verification process before the CA issues a certificate. The RA validates that the requestor is who they claim to be.

**Certificate Revocation List (CRL)** is a published list of certificates that have been revoked before their expiration date, due to key compromise, change of ownership, or other reasons.

**Online Certificate Status Protocol (OCSP)** provides real-time certificate status checking. Instead of downloading the entire CRL, a client can query an OCSP responder for the status of a specific certificate.

### Digital Certificates (X.509)

A digital certificate contains:
- **Subject** -- The entity the certificate identifies (domain name, organization)
- **Public Key** -- The subject's public key
- **Issuer** -- The CA that issued the certificate
- **Serial Number** -- Unique identifier for the certificate
- **Validity Period** -- Not Before and Not After dates
- **Signature Algorithm** -- The algorithm used by the CA to sign the certificate
- **Digital Signature** -- The CA's signature, verifying the certificate's authenticity
- **Extensions** -- Additional information like key usage, subject alternative names (SANs)

### Certificate Types

**Domain Validated (DV)** -- The CA verifies that the requestor controls the domain. Quickest and cheapest. Let's Encrypt provides free DV certificates.

**Organization Validated (OV)** -- The CA also verifies the organization's legal existence and identity. Provides more trust than DV.

**Extended Validation (EV)** -- The most rigorous verification process. The CA verifies legal, physical, and operational existence. Previously shown with a green address bar in browsers.

**Wildcard Certificates** -- Secure a domain and all its subdomains (e.g., *.example.com covers www.example.com, mail.example.com, etc.).

**SAN (Subject Alternative Name) Certificates** -- Secure multiple specific domains with a single certificate.

### TLS/SSL Handshake

When you visit an HTTPS website, the following happens:

1. **Client Hello** -- Your browser sends supported TLS versions and cipher suites
2. **Server Hello** -- The server selects a TLS version and cipher suite, sends its certificate
3. **Certificate Verification** -- Your browser verifies the certificate chain up to a trusted root CA
4. **Key Exchange** -- Client and server negotiate a shared symmetric session key
5. **Secure Communication** -- All subsequent data is encrypted with the session key

This entire process happens in milliseconds, establishing a secure, authenticated connection.

### Certificate Lifecycle Management

- **Request/Enrollment** -- Generate a key pair, create a Certificate Signing Request (CSR), submit to CA
- **Issuance** -- CA validates identity and issues the certificate
- **Installation** -- Deploy the certificate on the server or device
- **Monitoring** -- Track expiration dates, detect misuse or unauthorized certificates
- **Renewal** -- Obtain a new certificate before the current one expires (typically 90 days to 1 year)
- **Revocation** -- Revoke the certificate if the private key is compromised or the entity changes
- **Certificate Transparency (CT)** -- Public logs of all issued certificates, enabling detection of rogue or misissued certificates`,
        },
        {
          id: 'cybersecurity-fundamentals__m3__l4',
          title: 'Encryption in Practice',
          objectives: [
            'Apply encryption concepts to real-world scenarios',
            'Describe data encryption at rest and in transit',
            'Explain end-to-end encryption and its limitations',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'Data should be encrypted both at rest (stored) and in transit (moving)',
            'End-to-end encryption ensures only the communicating parties can read messages',
            'Key management is often the hardest part of implementing encryption',
          ],
          content: `## Encryption in Practice

Understanding cryptographic algorithms is important, but knowing how to apply them correctly in real-world scenarios is critical. This lesson covers practical encryption implementations you'll encounter as a security professional.

### Data at Rest Encryption

**Data at rest** is data stored on a device or medium -- hard drives, databases, cloud storage, USB drives, mobile devices.

**Full Disk Encryption (FDE)** encrypts the entire storage device:
- **BitLocker** (Windows) -- Uses AES-128 or AES-256, stores keys in TPM chip
- **FileVault** (macOS) -- Uses XTS-AES-128 encryption
- **LUKS** (Linux) -- Linux Unified Key Setup for disk encryption

FDE protects against physical theft. If someone steals a laptop with FDE enabled, they cannot read the data without the encryption key. However, FDE does NOT protect data when the system is running and the disk is unlocked.

**Database Encryption** protects sensitive data stored in databases:
- **Transparent Data Encryption (TDE)** -- Encrypts database files on disk automatically. Data is decrypted when read into memory.
- **Column-level encryption** -- Encrypts specific columns containing sensitive data (SSNs, credit card numbers). More granular but higher performance overhead.
- **Application-level encryption** -- The application encrypts data before storing it in the database. The database never sees plaintext data.

**Cloud Storage Encryption** -- Cloud providers encrypt data at rest by default:
- **Server-side encryption (SSE)** -- The cloud provider manages the encryption keys
- **Client-side encryption** -- You encrypt data before uploading. The cloud provider never has access to your keys or plaintext data.
- **BYOK (Bring Your Own Key)** -- You provide and manage the encryption keys, but the cloud provider performs the encryption/decryption

### Data in Transit Encryption

**Data in transit** is data moving across networks -- between a browser and web server, between data centers, or between services.

**TLS (Transport Layer Security)** is the standard protocol for encrypting data in transit:
- Used by HTTPS, SMTPS, FTPS, and many other protocols
- TLS 1.3 (current version) offers improved performance and security over TLS 1.2
- TLS 1.0 and 1.1 are deprecated and should be disabled

**HTTPS Everywhere** -- All web traffic should use HTTPS. Modern browsers flag HTTP sites as "Not Secure." HTTP Strict Transport Security (HSTS) tells browsers to always use HTTPS for a domain.

**Email Encryption:**
- **S/MIME** -- Uses PKI certificates for email encryption and signing
- **PGP/GPG** -- Uses a web of trust model instead of CAs. Users verify each other's keys directly.
- **TLS for email transport** -- STARTTLS encrypts the connection between mail servers, but doesn't provide end-to-end encryption

### End-to-End Encryption (E2EE)

**E2EE** ensures that only the communicating parties can read the messages. Not even the service provider can decrypt the content:

- **Signal Protocol** -- Used by Signal, WhatsApp, and Facebook Messenger. Provides forward secrecy (compromising current keys doesn't expose past messages).
- **iMessage** -- Apple's E2EE messaging system
- **Matrix/Element** -- Open-source E2EE messaging protocol

**Limitations of E2EE:**
- Metadata is still visible -- who communicated with whom, when, and how much data was transferred
- Endpoint compromise defeats E2EE -- if malware is on your device, it can read messages before/after encryption
- Key verification is essential -- without verifying the other party's key, man-in-the-middle attacks are possible

### Key Management

The hardest part of encryption is not the algorithm -- it's managing the keys. Poor key management undermines even the strongest encryption.

**Key Management Best Practices:**
- **Key generation** -- Use cryptographically secure random number generators
- **Key storage** -- Never store keys in plaintext, in code, or alongside encrypted data. Use Hardware Security Modules (HSMs), key vaults (AWS KMS, Azure Key Vault, HashiCorp Vault), or TPM chips
- **Key rotation** -- Regularly change encryption keys. If a key is compromised, only data encrypted with that key is at risk
- **Key escrow/recovery** -- Maintain secure backup copies of keys in case of loss
- **Key destruction** -- Securely destroy keys when no longer needed using cryptographic erasure`,
        },
      ],
      quiz: [
        {
          id: 'cybersecurity-fundamentals__m3__q1',
          question: 'Which encryption approach uses the same key for both encryption and decryption?',
          options: ['Asymmetric encryption', 'Public-key encryption', 'Symmetric encryption', 'Elliptic curve encryption'],
          correctIndex: 2,
          explanation: 'Symmetric encryption uses a single shared key for both encryption and decryption. Both parties must possess this key, which creates the key distribution challenge.',
        },
        {
          id: 'cybersecurity-fundamentals__m3__q2',
          question: 'Why is AES preferred over DES for modern encryption?',
          options: [
            'AES is free while DES requires a license',
            'AES uses larger key sizes and has no known practical attacks',
            'AES is an asymmetric algorithm while DES is symmetric',
            'AES was created by the NSA while DES was not',
          ],
          correctIndex: 1,
          explanation: 'AES supports key sizes of 128, 192, and 256 bits with no known practical attacks, while DES uses only a 56-bit key that can be brute-forced in hours with modern hardware.',
        },
        {
          id: 'cybersecurity-fundamentals__m3__q3',
          question: 'What property of hash functions ensures that a small change in input produces a completely different output?',
          options: ['Collision resistance', 'Determinism', 'Avalanche effect', 'Pre-image resistance'],
          correctIndex: 2,
          explanation: 'The avalanche effect ensures that even a tiny change in the input (like changing a single character) produces a dramatically different hash output.',
        },
        {
          id: 'cybersecurity-fundamentals__m3__q4',
          question: 'In a digital signature, the sender encrypts the hash with which key?',
          options: ["Recipient's public key", "Sender's private key", "Shared symmetric key", "CA's public key"],
          correctIndex: 1,
          explanation: "The sender encrypts the hash with their private key to create the digital signature. The recipient decrypts it with the sender's public key to verify authenticity.",
        },
        {
          id: 'cybersecurity-fundamentals__m3__q5',
          question: 'What is the primary purpose of a Certificate Authority (CA)?',
          options: [
            'To encrypt data in transit',
            'To generate encryption keys for users',
            'To verify identities and issue digital certificates',
            'To store private keys securely',
          ],
          correctIndex: 2,
          explanation: 'A Certificate Authority verifies the identity of entities and issues digital certificates that bind public keys to verified identities, establishing trust in PKI.',
        },
        {
          id: 'cybersecurity-fundamentals__m3__q6',
          question: 'Which hashing algorithm should be used for password storage?',
          options: ['MD5', 'SHA-256', 'SHA-1', 'Argon2'],
          correctIndex: 3,
          explanation: 'Argon2 is designed specifically for password hashing -- it is intentionally slow and includes salting to resist brute-force and rainbow table attacks. General-purpose hashes like SHA-256 are too fast for password storage.',
        },
      ],
    },

    // ── Module 4: Risk Management ───────────────────────────────────────
    {
      id: 'cybersecurity-fundamentals__m4',
      title: 'Risk Management',
      description: 'Learn risk assessment methodologies, incident response planning, business continuity, and compliance frameworks.',
      lessons: [
        {
          id: 'cybersecurity-fundamentals__m4__l1',
          title: 'Risk Assessment and Analysis',
          objectives: [
            'Define risk in the context of cybersecurity',
            'Perform qualitative and quantitative risk assessments',
            'Apply risk treatment strategies',
          ],
          estimatedMinutes: 25,
          keyTakeaways: [
            'Risk = Threat x Vulnerability x Impact',
            'Risk can be mitigated, transferred, accepted, or avoided',
            'Risk assessment should be an ongoing process, not a one-time event',
          ],
          content: `## Risk Assessment and Analysis

**Risk management** is the process of identifying, assessing, and controlling threats to an organization's assets. In cybersecurity, it provides a structured approach to prioritizing security efforts and allocating resources effectively.

### Understanding Risk

**Risk** is the potential for loss or damage when a threat exploits a vulnerability. The fundamental risk equation is:

**Risk = Threat x Vulnerability x Impact**

- **Threat** -- Any potential danger that could exploit a vulnerability (hackers, malware, natural disasters, human error)
- **Vulnerability** -- A weakness that could be exploited (unpatched software, misconfiguration, lack of training)
- **Impact** -- The potential consequence if the threat materializes (financial loss, reputational damage, operational disruption, legal penalties)

An **asset** is anything of value to the organization -- data, systems, people, reputation, intellectual property.

### Risk Assessment Methodologies

**Qualitative Risk Assessment** uses subjective ratings (High, Medium, Low) to evaluate risks:

1. Identify assets and their value to the organization
2. Identify threats and vulnerabilities for each asset
3. Assess the likelihood of each threat occurring (High/Medium/Low)
4. Assess the potential impact (High/Medium/Low)
5. Calculate risk rating using a risk matrix

A **risk matrix** plots likelihood against impact to categorize risks. For example, a high-likelihood, high-impact risk requires immediate attention, while a low-likelihood, low-impact risk may be acceptable.

Qualitative assessments are faster and easier to perform but are subjective and inconsistent across assessors.

**Quantitative Risk Assessment** uses numerical values to calculate risk in financial terms:

- **Asset Value (AV)** -- The monetary value of the asset
- **Exposure Factor (EF)** -- The percentage of asset value lost in an incident (0-100%)
- **Single Loss Expectancy (SLE)** = AV x EF -- The expected monetary loss from a single incident
- **Annual Rate of Occurrence (ARO)** -- How many times per year the incident is expected to occur
- **Annual Loss Expectancy (ALE)** = SLE x ARO -- The expected annual monetary loss

**Example:** A database server worth $200,000 (AV) has a 40% chance of being damaged by a flood (EF = 0.4). Floods occur roughly once every 5 years (ARO = 0.2).
- SLE = $200,000 x 0.4 = $80,000
- ALE = $80,000 x 0.2 = $16,000/year

If a flood prevention system costs $10,000/year, it's worth the investment since ALE ($16,000) exceeds the control cost ($10,000).

### Risk Treatment Options

After identifying and assessing risks, organizations choose how to handle each one:

**Risk Mitigation (Reduction)** -- Implement controls to reduce the likelihood or impact. This is the most common approach. Examples: deploying firewalls, implementing MFA, training employees, patching systems.

**Risk Transfer** -- Shift the financial impact to a third party, typically through cyber insurance or outsourcing. Note: you can transfer financial risk, but not accountability.

**Risk Acceptance** -- Acknowledge the risk and choose to accept it without additional controls. This is appropriate for low-probability, low-impact risks where the cost of mitigation exceeds the potential loss. Risk acceptance should be documented and approved by management.

**Risk Avoidance** -- Eliminate the risk by removing the activity or asset entirely. For example, if a legacy application poses unacceptable risk, discontinue it. This isn't always practical but is the most complete risk treatment.

### Risk Register

A **risk register** is a document that tracks all identified risks, their assessments, treatment decisions, and status. For each risk, record:
- Risk description and ID
- Asset affected
- Threat and vulnerability
- Likelihood and impact ratings
- Risk score
- Treatment decision and controls
- Risk owner (who is accountable)
- Status and review date`,
        },
        {
          id: 'cybersecurity-fundamentals__m4__l2',
          title: 'Incident Response Planning',
          objectives: [
            'Describe the phases of incident response',
            'Explain the roles in an incident response team',
            'Develop an incident response plan outline',
          ],
          estimatedMinutes: 25,
          keyTakeaways: [
            'Incident response follows six phases: preparation, identification, containment, eradication, recovery, and lessons learned',
            'A documented IR plan is essential -- you cannot create one during an active incident',
            'Regular tabletop exercises test and improve IR capabilities',
          ],
          content: `## Incident Response Planning

An **incident** is any event that threatens the confidentiality, integrity, or availability of an organization's information systems. **Incident response (IR)** is the organized approach to addressing and managing the aftermath of a security breach or attack.

### The Six Phases of Incident Response (NIST SP 800-61)

**1. Preparation**

This is the most critical phase -- it happens before any incident occurs:
- Develop and document the incident response plan
- Build and train the incident response team
- Deploy monitoring and detection tools
- Establish communication channels and escalation procedures
- Create incident classification criteria
- Prepare forensic toolkits and jump bags
- Conduct regular tabletop exercises and simulations
- Maintain contact lists for law enforcement, legal counsel, and PR

**2. Identification**

Detect and determine whether an event constitutes a security incident:
- Monitor alerts from SIEM, IDS/IPS, EDR, and other security tools
- Investigate anomalies reported by users or automated systems
- Classify the incident severity (Critical, High, Medium, Low)
- Document initial findings: what happened, when, which systems affected
- Activate the incident response team based on severity

Not every alert is an incident. Triage is essential to distinguish real threats from false positives.

**3. Containment**

Stop the incident from spreading and causing additional damage:

**Short-term containment** -- Immediate actions to limit the blast radius:
- Isolate affected systems from the network
- Block malicious IP addresses or domains
- Disable compromised user accounts
- Implement emergency firewall rules

**Long-term containment** -- More sustainable measures while you prepare for eradication:
- Rebuild affected systems from clean images
- Apply patches to close exploited vulnerabilities
- Implement additional monitoring on affected systems
- Preserve forensic evidence (disk images, memory dumps, logs)

**4. Eradication**

Remove the threat completely from the environment:
- Identify and remove all malware, backdoors, and rootkits
- Close the vulnerability that was exploited
- Reset compromised credentials
- Scan all systems for indicators of compromise (IOCs)
- Verify that the threat is completely eliminated

**5. Recovery**

Restore systems and operations to normal:
- Restore systems from clean backups or rebuild from scratch
- Bring systems back online gradually, starting with critical services
- Monitor restored systems closely for signs of reinfection
- Verify system integrity and functionality
- Communicate with stakeholders about restoration progress

**6. Lessons Learned (Post-Incident Review)**

Conduct a thorough review after the incident is resolved:
- Hold a post-incident meeting within 1-2 weeks
- Document what happened, timeline, root cause, and actions taken
- Identify what worked well and what needs improvement
- Update the incident response plan based on findings
- Implement additional controls to prevent recurrence
- Share relevant information with the broader security community (as appropriate)

### Incident Response Team Roles

- **Incident Commander** -- Leads the response effort, makes key decisions
- **Security Analysts** -- Investigate and analyze the technical aspects
- **Forensics Specialists** -- Preserve and analyze evidence
- **IT Operations** -- Implement containment and recovery actions
- **Legal Counsel** -- Advise on regulatory obligations and liability
- **Communications/PR** -- Manage internal and external communications
- **Executive Sponsor** -- Provides authority and resources

### Tabletop Exercises

**Tabletop exercises** simulate incidents without affecting real systems. The team walks through a scenario, discussing their response at each stage. These exercises reveal gaps in the IR plan, clarify roles, and build muscle memory.

Common scenarios include:
- Ransomware attack on critical systems
- Data breach exposing customer information
- Insider threat exfiltrating intellectual property
- DDoS attack disrupting online services
- Supply chain compromise through a third-party vendor`,
        },
        {
          id: 'cybersecurity-fundamentals__m4__l3',
          title: 'Business Continuity and Disaster Recovery',
          objectives: [
            'Differentiate between business continuity and disaster recovery',
            'Define RPO and RTO and their business implications',
            'Describe backup strategies and disaster recovery architectures',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'BC keeps the business running during disruptions; DR restores IT systems after a disaster',
            'RPO defines acceptable data loss; RTO defines acceptable downtime',
            'The 3-2-1 backup rule provides resilience: 3 copies, 2 media types, 1 offsite',
          ],
          content: `## Business Continuity and Disaster Recovery

### Business Continuity (BC) vs. Disaster Recovery (DR)

**Business Continuity Planning (BCP)** ensures that critical business functions can continue during and after a disaster. It covers the entire organization: people, processes, facilities, and technology.

**Disaster Recovery (DR)** is a subset of BCP focused specifically on restoring IT systems and data after a disaster. DR is the technical component of the broader business continuity strategy.

### Key Metrics

**Recovery Point Objective (RPO)** -- The maximum acceptable amount of data loss measured in time. An RPO of 4 hours means the organization can tolerate losing up to 4 hours of data. RPO determines backup frequency:
- RPO of 24 hours → Daily backups are sufficient
- RPO of 1 hour → Hourly backups or continuous replication needed
- RPO of 0 → Real-time synchronous replication required

**Recovery Time Objective (RTO)** -- The maximum acceptable downtime after a disaster. An RTO of 2 hours means systems must be restored within 2 hours. RTO determines the DR architecture:
- RTO of days → Cold site (basic facility, no equipment pre-deployed)
- RTO of hours → Warm site (facility with some equipment, needs configuration)
- RTO of minutes → Hot site (fully equipped mirror of production)
- RTO of seconds → Active-active (multiple sites running simultaneously)

**Maximum Tolerable Downtime (MTD)** -- The absolute maximum time a business function can be unavailable before the organization faces unacceptable consequences (financial ruin, regulatory penalties, loss of life).

### Business Impact Analysis (BIA)

A **BIA** identifies critical business processes and determines the impact of disruption:

1. **Identify critical processes** -- Which business functions are essential?
2. **Determine dependencies** -- What IT systems, data, and resources does each process require?
3. **Assess impact** -- What is the financial, operational, and reputational impact of disruption over time?
4. **Set RPO/RTO** -- Based on impact analysis, determine acceptable data loss and downtime for each process
5. **Prioritize** -- Rank processes for recovery order

### Backup Strategies

**The 3-2-1 Rule:**
- **3** copies of your data (1 primary + 2 backups)
- **2** different storage media types (local disk + tape/cloud)
- **1** copy stored offsite (or in the cloud)

**Backup Types:**
- **Full Backup** -- Complete copy of all data. Slowest to create, fastest to restore.
- **Incremental Backup** -- Only data changed since the last backup (full or incremental). Fast to create, slower to restore (requires the full backup plus all incremental backups in sequence).
- **Differential Backup** -- All data changed since the last full backup. Faster to restore than incremental (requires only the full backup plus the latest differential), but grows larger over time.

**Backup Testing** is critical -- an untested backup is not a backup. Regularly test restore procedures to verify:
- Backups complete successfully
- Data can be restored within the RTO
- Restored data is complete and uncorrupted
- The restore process is documented and repeatable

### Disaster Recovery Architectures

**Cold Site** -- A basic facility with power, cooling, and network connectivity, but no pre-deployed equipment. In a disaster, hardware must be procured, installed, and configured before recovery can begin. Lowest cost, longest RTO (days to weeks).

**Warm Site** -- A facility with pre-installed hardware and network infrastructure, but not running current data or applications. Data must be restored from backups and systems configured before going live. Moderate cost, moderate RTO (hours to days).

**Hot Site** -- A fully operational mirror of the production environment with current data. In a disaster, operations can be switched to the hot site with minimal downtime. Highest cost, shortest RTO (minutes to hours).

**Cloud-Based DR** -- Cloud services provide flexible DR options:
- **Backup to cloud** -- Store backups in cloud storage (S3, Azure Blob)
- **Pilot light** -- Minimal environment running in the cloud, scaled up during disaster
- **Warm standby** -- Scaled-down version running in the cloud, ready to scale up
- **Multi-region active-active** -- Full redundancy across cloud regions`,
        },
        {
          id: 'cybersecurity-fundamentals__m4__l4',
          title: 'Security Frameworks and Compliance',
          objectives: [
            'Identify major cybersecurity frameworks and their purposes',
            'Explain key compliance requirements for common regulations',
            'Describe how frameworks guide security program development',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'Frameworks provide structured approaches to building security programs',
            'Compliance requirements vary by industry but often overlap in core controls',
            'Security frameworks should be adapted to organizational needs, not adopted blindly',
          ],
          content: `## Security Frameworks and Compliance

### Why Frameworks Matter

Security frameworks provide structured, proven approaches to building and managing security programs. Instead of inventing your own approach, frameworks offer:
- **Comprehensive coverage** -- Ensure you don't overlook critical security domains
- **Common language** -- Enable communication about security across the organization and with partners
- **Compliance alignment** -- Map controls to regulatory requirements
- **Benchmarking** -- Measure your security maturity against industry standards
- **Prioritization** -- Focus resources on the most impactful controls

### Major Security Frameworks

**NIST Cybersecurity Framework (CSF)** is the most widely adopted framework in the US. It organizes security activities into five core functions:

1. **Identify** -- Understand your assets, business environment, governance, risk assessment, and risk management strategy
2. **Protect** -- Implement safeguards including access control, training, data security, maintenance, and protective technology
3. **Detect** -- Develop capabilities to identify cybersecurity events through monitoring, detection processes, and anomaly detection
4. **Respond** -- Take action when an incident occurs -- response planning, communications, analysis, mitigation, improvements
5. **Recover** -- Restore capabilities after an incident -- recovery planning, improvements, communications

The CSF is flexible and scalable, working for organizations of all sizes and industries.

**ISO 27001/27002** is the international standard for information security management systems (ISMS). ISO 27001 defines the requirements for establishing, implementing, maintaining, and improving an ISMS. ISO 27002 provides detailed guidance on security controls. Organizations can be certified against ISO 27001 through third-party audits.

**CIS Controls** (Center for Internet Security) provides a prioritized set of actions to protect against the most common cyber attacks. The controls are organized into three implementation groups:
- **IG1** -- Basic cyber hygiene (essential for all organizations)
- **IG2** -- For organizations with moderate risk
- **IG3** -- For organizations with significant risk or regulatory requirements

The top CIS controls include inventory of authorized devices and software, secure configurations, continuous vulnerability management, controlled use of administrative privileges, and audit log management.

### Key Compliance Requirements

**PCI DSS (Payment Card Industry Data Security Standard)** applies to any organization that handles credit card data. Key requirements include network segmentation, encryption of card data, access controls, vulnerability management, and regular security testing. Non-compliance can result in fines and loss of the ability to process credit cards.

**HIPAA (Health Insurance Portability and Accountability Act)** protects health information in the US. The Security Rule requires administrative, physical, and technical safeguards for electronic protected health information (ePHI). Covered entities must conduct risk assessments, implement access controls, encrypt data, and train employees.

**GDPR (General Data Protection Regulation)** is the European Union's comprehensive data protection law. Key principles include data minimization, purpose limitation, consent, the right to erasure, data breach notification within 72 hours, and Privacy by Design. Fines can reach 4% of global annual revenue.

**SOC 2 (Service Organization Control 2)** is an auditing framework for service providers that store customer data. It evaluates controls based on five Trust Services Criteria: Security, Availability, Processing Integrity, Confidentiality, and Privacy. SOC 2 Type I assesses controls at a point in time; Type II assesses controls over a period (typically 6-12 months).

### Building a Security Program

A practical approach to building a security program using frameworks:

1. **Assess current state** -- Where are you today? Use a framework to evaluate existing controls and identify gaps.
2. **Define target state** -- Where do you need to be? Consider regulatory requirements, business risk, and industry best practices.
3. **Gap analysis** -- What's the difference between current and target state?
4. **Prioritize** -- Which gaps pose the greatest risk? Focus on high-impact, achievable improvements first.
5. **Implement** -- Deploy controls, policies, and procedures to close gaps.
6. **Measure** -- Track metrics like patch compliance, incident response time, and vulnerability counts.
7. **Improve** -- Continuously review and enhance the security program based on changing threats and business needs.`,
        },
      ],
      quiz: [
        {
          id: 'cybersecurity-fundamentals__m4__q1',
          question: 'What does the risk equation "Risk = Threat x Vulnerability x Impact" help determine?',
          options: [
            'The exact dollar amount of potential losses',
            'The potential for loss when a threat exploits a vulnerability',
            'The number of vulnerabilities in a system',
            'The likelihood of a specific attack occurring',
          ],
          correctIndex: 1,
          explanation: 'The risk equation helps determine the overall risk level by considering the threat (potential danger), vulnerability (weakness), and impact (consequence) together.',
        },
        {
          id: 'cybersecurity-fundamentals__m4__q2',
          question: 'What is the correct order of the NIST incident response phases?',
          options: [
            'Identification, Containment, Preparation, Eradication, Recovery, Lessons Learned',
            'Preparation, Identification, Containment, Eradication, Recovery, Lessons Learned',
            'Preparation, Detection, Response, Recovery, Restoration, Review',
            'Assessment, Detection, Containment, Removal, Recovery, Documentation',
          ],
          correctIndex: 1,
          explanation: 'The NIST SP 800-61 incident response phases are: Preparation, Identification, Containment, Eradication, Recovery, and Lessons Learned.',
        },
        {
          id: 'cybersecurity-fundamentals__m4__q3',
          question: 'If an organization has an RPO of 4 hours, what does this mean?',
          options: [
            'Systems must be restored within 4 hours',
            'The organization can tolerate losing up to 4 hours of data',
            'Backups must be stored for at least 4 hours',
            'The incident response team has 4 hours to contain a breach',
          ],
          correctIndex: 1,
          explanation: 'Recovery Point Objective (RPO) defines the maximum acceptable data loss measured in time. An RPO of 4 hours means the organization can tolerate losing up to 4 hours worth of data.',
        },
        {
          id: 'cybersecurity-fundamentals__m4__q4',
          question: 'Which risk treatment involves purchasing cyber insurance?',
          options: ['Risk mitigation', 'Risk transfer', 'Risk acceptance', 'Risk avoidance'],
          correctIndex: 1,
          explanation: 'Risk transfer shifts the financial impact of a risk to a third party, typically through insurance or outsourcing. Cyber insurance is the most common example of risk transfer.',
        },
        {
          id: 'cybersecurity-fundamentals__m4__q5',
          question: 'Which framework organizes security into Identify, Protect, Detect, Respond, and Recover?',
          options: ['ISO 27001', 'NIST Cybersecurity Framework', 'CIS Controls', 'PCI DSS'],
          correctIndex: 1,
          explanation: 'The NIST Cybersecurity Framework organizes security activities into five core functions: Identify, Protect, Detect, Respond, and Recover.',
        },
        {
          id: 'cybersecurity-fundamentals__m4__q6',
          question: 'What is the 3-2-1 backup rule?',
          options: [
            '3 backups daily, 2 weekly, 1 monthly',
            '3 copies of data, 2 different media types, 1 offsite',
            '3 encryption keys, 2 algorithms, 1 master key',
            '3 servers, 2 data centers, 1 cloud region',
          ],
          correctIndex: 1,
          explanation: 'The 3-2-1 backup rule recommends keeping 3 copies of your data, on 2 different storage media types, with 1 copy stored offsite (or in the cloud).',
        },
      ],
    },
  ],
};
