import type { FullCourse } from '../courseContent';

export const networkFundamentals: FullCourse = {
  id: 'network-fundamentals',
  instructorName: 'David Park',
  instructorBio:
    'Network engineer with CCNP certification and 12 years designing enterprise networks.',
  learningOutcomes: [
    'Explain the TCP/IP and OSI models and how data traverses each layer',
    'Configure and troubleshoot basic routing and switching in enterprise environments',
    'Design and secure wireless networks following industry best practices',
    'Diagnose common network issues using systematic troubleshooting methodologies',
  ],
  modules: [
    // ── Module 1: TCP/IP & OSI Model ──────────────────────────────────
    {
      id: 'network-fundamentals__m1',
      title: 'TCP/IP & OSI Model',
      description:
        'Understand the foundational reference models that describe how data moves across networks, from physical signals on a cable to application-layer protocols.',
      lessons: [
        {
          id: 'network-fundamentals__m1__l1',
          title: 'Introduction to Network Models',
          objectives: [
            'Explain why layered network models exist and the problems they solve',
            'Compare the OSI seven-layer model with the TCP/IP four-layer model',
            'Identify which real-world protocols belong to each layer',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'Layered models break complex networking into manageable, independent layers so engineers can troubleshoot and innovate at one layer without disrupting others',
            'The OSI model has seven layers (Physical, Data Link, Network, Transport, Session, Presentation, Application) while TCP/IP condenses these into four (Network Access, Internet, Transport, Application)',
            'Most modern networks use TCP/IP in practice, but the OSI model remains the universal teaching and troubleshooting framework',
          ],
          content: `## Introduction to Network Models

When two computers communicate, dozens of things happen simultaneously: electrical signals travel over copper, bits get grouped into frames, addresses get resolved, errors get detected, and applications exchange meaningful data. Without an organizing framework, understanding -- let alone troubleshooting -- all of this would be nearly impossible.

### Why Layered Models?

In the early days of networking, every vendor built proprietary systems. IBM's SNA could not talk to DEC's DECnet. If you wanted to change your network cable, you might have to rewrite your application software. Layered models solved this by defining **clear boundaries** between different networking functions.

Think of it like the postal system. You write a letter (application layer), put it in an envelope with an address (network layer), hand it to the mail carrier (data link layer), and a truck physically transports it (physical layer). Each participant does their job without needing to know the details of the other steps. If the postal service switches from trucks to drones, you do not need to change how you write letters.

### The OSI Reference Model

The **Open Systems Interconnection (OSI)** model was developed by the International Organization for Standardization (ISO) in the early 1980s. It divides networking into seven layers:

| Layer | Name         | Function                                  | Example               |
|-------|--------------|-------------------------------------------|-----------------------|
| 7     | Application  | End-user services and interfaces          | HTTP, SMTP, DNS       |
| 6     | Presentation | Data formatting, encryption, compression  | SSL/TLS, JPEG, ASCII  |
| 5     | Session      | Managing dialogue between applications    | NetBIOS, RPC          |
| 4     | Transport    | Reliable or unreliable end-to-end delivery| TCP, UDP              |
| 3     | Network      | Logical addressing and routing            | IP, ICMP, OSPF        |
| 2     | Data Link    | Physical addressing and frame delivery    | Ethernet, Wi-Fi, ARP  |
| 1     | Physical     | Raw bit transmission over media           | Cables, hubs, signals |

A common mnemonic is **"Please Do Not Throw Sausage Pizza Away"** (Physical through Application).

### The TCP/IP Model

While the OSI model was being debated in committees, engineers at DARPA were building the actual Internet. The **TCP/IP model** emerged from this practical work and has four layers:

1. **Network Access** (combines OSI layers 1-2) -- handles physical transmission and local network delivery.
2. **Internet** (OSI layer 3) -- provides logical addressing via IP and routing between networks.
3. **Transport** (OSI layer 4) -- manages end-to-end communication via TCP or UDP.
4. **Application** (combines OSI layers 5-7) -- encompasses all higher-level protocols.

### Encapsulation: How Data Travels Down the Stack

When you send an email, the data passes down through each layer, and each layer wraps the data in its own **header** (and sometimes a trailer). This process is called **encapsulation**:

- The application creates the **data** (your email message).
- The transport layer adds a TCP header, creating a **segment**.
- The network layer adds an IP header, creating a **packet**.
- The data link layer adds an Ethernet header and trailer, creating a **frame**.
- The physical layer converts the frame into **bits** -- electrical signals, light pulses, or radio waves.

At the receiving end, each layer strips off its header in reverse order. This is called **de-encapsulation**.

### Practical Significance

Understanding these models is not just academic. When you troubleshoot a network problem, you systematically work through the layers:

- Can the device physically connect? (Layer 1)
- Does it have a valid MAC address and can it reach the local switch? (Layer 2)
- Does it have an IP address and can it ping the gateway? (Layer 3)
- Is the port open and the service running? (Layers 4-7)

This bottom-up or top-down approach saves hours of random guessing. Every certification exam -- CompTIA Network+, CCNA, CCNP -- tests your understanding of these models because they are the foundation of every networking concept that follows.`,
        },
        {
          id: 'network-fundamentals__m1__l2',
          title: 'IP Addressing and Subnetting',
          objectives: [
            'Distinguish between IPv4 and IPv6 addressing schemes',
            'Calculate subnet masks, network addresses, and broadcast addresses',
            'Design an IP addressing plan for a small office network',
          ],
          estimatedMinutes: 25,
          keyTakeaways: [
            'IPv4 uses 32-bit addresses expressed in dotted decimal notation, providing roughly 4.3 billion unique addresses',
            'Subnetting divides a large network into smaller segments using subnet masks, improving security, performance, and address management',
            'CIDR notation (e.g., /24) indicates how many bits are used for the network portion and has replaced classful addressing in modern networks',
            'IPv6 uses 128-bit addresses written in hexadecimal colon notation, effectively providing an unlimited address space',
          ],
          content: `## IP Addressing and Subnetting

Every device on a network needs a unique address so other devices know where to send data. The **Internet Protocol (IP)** defines the addressing scheme that makes this possible. Understanding IP addressing and subnetting is one of the most important skills a network professional can develop.

### IPv4 Address Structure

An IPv4 address is a **32-bit number** typically written in **dotted decimal notation**: four octets separated by dots. For example, \`192.168.1.100\`. Each octet ranges from 0 to 255.

In binary, that address looks like: \`11000000.10101000.00000001.01100100\`

Every IP address has two parts:
- **Network portion** -- identifies which network the device belongs to
- **Host portion** -- identifies the specific device on that network

The **subnet mask** tells you where the boundary falls. A subnet mask of \`255.255.255.0\` (or **/24** in CIDR notation) means the first 24 bits are the network portion and the last 8 bits identify hosts.

### Subnetting in Practice

Suppose your company is assigned the network \`10.0.0.0/8\`, giving you over 16 million host addresses. Putting all devices on one flat network would be a disaster -- broadcast storms, security risks, and impossible management. **Subnetting** lets you carve this into smaller, logical segments.

**Example**: You need four departments, each with up to 60 hosts.

1. Start with a block like \`10.0.0.0/24\` (256 addresses, 254 usable).
2. To fit 60 hosts, you need at least 6 host bits (2^6 = 64 addresses, 62 usable).
3. That means a **/26** subnet mask (\`255.255.255.192\`).
4. Your four subnets:
   - \`10.0.0.0/26\` -- hosts .1 through .62
   - \`10.0.0.64/26\` -- hosts .65 through .126
   - \`10.0.0.128/26\` -- hosts .129 through .190
   - \`10.0.0.192/26\` -- hosts .193 through .254

Each subnet has a **network address** (first address, e.g., \`10.0.0.0\`), a **broadcast address** (last address, e.g., \`10.0.0.63\`), and **usable host addresses** (everything in between).

### The Subnetting Shortcut

For quick mental math, remember the "magic number" approach:

1. Subtract the interesting octet of the subnet mask from 256. For /26, the fourth octet is 192, so 256 - 192 = **64**.
2. Subnets increment by this magic number: 0, 64, 128, 192.
3. The broadcast address for each subnet is one less than the next subnet start.

### Private vs. Public Addresses

RFC 1918 reserves three ranges for private use -- these addresses are not routable on the public Internet:

- \`10.0.0.0/8\` (10.0.0.0 -- 10.255.255.255)
- \`172.16.0.0/12\` (172.16.0.0 -- 172.31.255.255)
- \`192.168.0.0/16\` (192.168.0.0 -- 192.168.255.255)

Your home router likely assigns addresses from \`192.168.1.0/24\`. It uses **Network Address Translation (NAT)** to map your private addresses to a single public address when you access the Internet.

### IPv6: The Next Generation

IPv4's 4.3 billion addresses are exhausted. **IPv6** uses **128-bit addresses**, written as eight groups of four hexadecimal digits separated by colons: \`2001:0db8:85a3:0000:0000:8a2e:0370:7334\`.

Simplification rules help: leading zeros in a group can be dropped, and one consecutive run of all-zero groups can be replaced with \`::\`. So the above becomes \`2001:db8:85a3::8a2e:370:7334\`.

IPv6 provides approximately 3.4 x 10^38 addresses -- enough to assign a unique address to every atom on the surface of the Earth and still have addresses left over. Beyond the larger address space, IPv6 brings built-in IPsec support, simplified headers for faster routing, and stateless address autoconfiguration (SLAAC).

### Designing an Address Plan

When planning IP addresses for a small office:

1. **Inventory your devices** -- workstations, servers, printers, phones, access points, IoT sensors.
2. **Group by function** -- put servers on one subnet, workstations on another, guest Wi-Fi on a third.
3. **Size each subnet** -- choose a prefix length that accommodates current devices plus 50% growth.
4. **Document everything** -- maintain a spreadsheet or IPAM tool that tracks every assignment.
5. **Reserve ranges** -- set aside addresses for infrastructure (gateways, DHCP servers) at the beginning or end of each subnet.

A well-designed addressing plan makes troubleshooting faster, security policies cleaner, and future expansion painless.`,
        },
        {
          id: 'network-fundamentals__m1__l3',
          title: 'TCP, UDP, and Transport Layer Protocols',
          objectives: [
            'Describe how TCP establishes reliable connections using the three-way handshake',
            'Compare TCP and UDP and identify use cases for each',
            'Explain how port numbers map to services and applications',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'TCP provides reliable, ordered delivery with error checking through mechanisms like the three-way handshake, sequence numbers, and acknowledgments',
            'UDP provides fast, connectionless delivery with minimal overhead, making it ideal for real-time applications like video streaming and VoIP',
            'Port numbers (0-65535) identify specific services on a host, with well-known ports 0-1023 reserved for common services like HTTP (80), HTTPS (443), and SSH (22)',
          ],
          content: `## TCP, UDP, and Transport Layer Protocols

The transport layer (Layer 4) is where two critical decisions happen: should the data arrive reliably or quickly, and which application on the destination machine should receive it? The two dominant transport protocols -- TCP and UDP -- answer these questions in fundamentally different ways.

### TCP: The Reliable Workhorse

The **Transmission Control Protocol (TCP)** guarantees that data arrives completely, in order, and without errors. It accomplishes this through several mechanisms.

#### The Three-Way Handshake

Before any data flows, TCP establishes a connection:

1. **SYN** -- The client sends a SYN (synchronize) packet to the server, saying "I want to connect. My starting sequence number is X."
2. **SYN-ACK** -- The server responds with SYN-ACK: "I acknowledge your sequence number X. My starting sequence number is Y."
3. **ACK** -- The client replies with ACK: "I acknowledge your sequence number Y. Let us begin."

This three-step process ensures both sides are ready and agree on starting sequence numbers, which are used to track every byte of data exchanged.

#### Sequence Numbers and Acknowledgments

Every byte TCP sends has a **sequence number**. The receiver sends back **acknowledgments** indicating the next byte it expects. If the sender does not receive an ACK within a timeout period, it **retransmits** the data. This guarantees nothing is lost.

#### Flow Control and Congestion Control

TCP uses a **sliding window** mechanism for flow control. The receiver advertises a **window size** -- the amount of data it can buffer. The sender never transmits more than this amount without receiving acknowledgments. This prevents a fast sender from overwhelming a slow receiver.

**Congestion control** algorithms like **slow start** and **congestion avoidance** prevent TCP from flooding the network. TCP starts by sending a small amount of data and gradually increases the rate until it detects packet loss, then backs off. This adaptive behavior is why TCP works well across wildly different network conditions.

#### Connection Termination

TCP closes a connection with a four-step process (FIN, ACK, FIN, ACK) or a three-step variant (FIN, FIN-ACK, ACK). This ensures both sides agree the conversation is over and all data has been delivered.

### UDP: Speed Over Reliability

The **User Datagram Protocol (UDP)** strips away all of TCP's guarantees. There is no handshake, no sequence numbers, no acknowledgments, no retransmission. UDP simply puts data into a datagram and sends it.

Why would anyone choose this? **Speed and efficiency.**

- **Video conferencing**: If a frame arrives late, it is useless -- the conversation has moved on. Retransmitting it would only add delay. UDP lets the application drop late packets and keep going.
- **DNS queries**: A single request-response exchange does not need the overhead of a full TCP connection. If the response does not arrive, the client simply asks again.
- **Online gaming**: Player positions need to arrive as fast as possible. A slightly out-of-date position is better than a delayed one.
- **VoIP (Voice over IP)**: Similar to video -- small gaps in audio are preferable to pauses caused by retransmission delays.

Applications that use UDP often implement their own lightweight reliability mechanisms at the application layer, only where strictly needed.

### Port Numbers: Directing Traffic to Applications

A single server might run a web server, email server, SSH daemon, and database simultaneously. **Port numbers** tell the transport layer which application should receive each incoming segment or datagram.

Port numbers range from **0 to 65,535** and are divided into three ranges:

| Range         | Name           | Usage                                     |
|---------------|----------------|-------------------------------------------|
| 0 - 1023      | Well-known     | Reserved for standard services (HTTP=80, HTTPS=443, SSH=22, DNS=53, SMTP=25) |
| 1024 - 49151  | Registered     | Assigned to specific applications (MySQL=3306, RDP=3389) |
| 49152 - 65535  | Dynamic/Ephemeral | Temporarily assigned to client connections |

When your browser connects to a web server, it sends a request **from** a random ephemeral port (say, 52344) **to** the server's port 443 (HTTPS). The server responds to port 52344. This combination of IP address and port number is called a **socket**, and a pair of sockets uniquely identifies every connection on the Internet.

### TCP vs. UDP: Choosing the Right Protocol

| Feature           | TCP                        | UDP                        |
|-------------------|----------------------------|----------------------------|
| Connection        | Connection-oriented        | Connectionless             |
| Reliability       | Guaranteed delivery        | Best-effort delivery       |
| Ordering          | Data arrives in order      | No ordering guarantee      |
| Speed             | Slower (overhead)          | Faster (minimal overhead)  |
| Header size       | 20-60 bytes                | 8 bytes                    |
| Use cases         | Web, email, file transfer  | Streaming, gaming, DNS     |

In practice, many modern applications use **both**. A web browser uses TCP for loading page content but might use UDP-based protocols like QUIC (the foundation of HTTP/3) to reduce latency on subsequent requests.`,
        },
        {
          id: 'network-fundamentals__m1__l4',
          title: 'DNS, DHCP, and Essential Network Services',
          objectives: [
            'Explain how DNS resolves domain names to IP addresses through recursive and iterative queries',
            'Describe how DHCP automates IP address assignment on a network',
            'Identify common DNS record types and their purposes',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'DNS is a hierarchical distributed database that translates human-readable domain names into IP addresses through a chain of queries from recursive resolvers to authoritative name servers',
            'DHCP uses a four-step process (Discover, Offer, Request, Acknowledge) to automatically assign IP addresses, subnet masks, gateways, and DNS server addresses to clients',
            'Common DNS records include A (IPv4 address), AAAA (IPv6 address), CNAME (alias), MX (mail server), NS (name server), and TXT (verification and policy)',
            'Properly configured DNS and DHCP are critical infrastructure services; their failure can make an entire network appear down even when connectivity is fine',
          ],
          content: `## DNS, DHCP, and Essential Network Services

Two services are so fundamental to modern networks that their failure can make an entire network appear broken even when the physical connectivity is perfectly fine: **DNS** and **DHCP**. Every network professional must understand how they work.

### DNS: The Internet's Phone Book

Humans remember names; computers use numbers. The **Domain Name System (DNS)** bridges this gap by translating domain names like \`www.gasweb.info\` into IP addresses like \`76.76.21.21\`.

#### The DNS Hierarchy

DNS is a **hierarchical, distributed database** organized like an inverted tree:

1. **Root servers** -- The starting point. Thirteen clusters of root servers (labeled A through M) are distributed globally. They do not know every domain but know where to find the **top-level domain (TLD)** servers.
2. **TLD servers** -- Manage domains like \`.com\`, \`.org\`, \`.net\`, \`.edu\`, and country codes like \`.uk\`. They point to the authoritative servers for specific domains.
3. **Authoritative name servers** -- Hold the actual DNS records for a domain. When you register \`example.com\`, your registrar configures authoritative name servers that store your A, MX, and other records.

#### How a DNS Query Works

When you type \`www.gasweb.info\` in your browser:

1. Your computer checks its **local DNS cache**. If it recently resolved this name, it uses the cached answer.
2. If not cached, it sends a query to your configured **recursive resolver** (often your ISP's DNS server or a public one like 8.8.8.8).
3. The recursive resolver checks its own cache. On a cache miss, it queries a **root server**, which responds with the address of the \`.info\` TLD server.
4. The resolver queries the \`.info\` TLD server, which responds with the authoritative name server for \`gasweb.info\`.
5. The resolver queries the **authoritative server**, which returns the IP address.
6. The resolver caches the answer (respecting the TTL -- Time to Live) and sends it to your computer.

This entire process typically takes **less than 100 milliseconds**.

#### Common DNS Record Types

| Record | Purpose                                    | Example                         |
|--------|--------------------------------------------|---------------------------------|
| A      | Maps a name to an IPv4 address             | \`www -> 93.184.216.34\`          |
| AAAA   | Maps a name to an IPv6 address             | \`www -> 2606:2800:220:1:...\`   |
| CNAME  | Creates an alias pointing to another name  | \`blog -> www.example.com\`       |
| MX     | Specifies mail servers for the domain      | \`10 mail.example.com\`           |
| NS     | Delegates a zone to name servers           | \`ns1.example.com\`               |
| TXT    | Holds text data for verification, SPF, etc.| \`v=spf1 include:_spf.google.com\`|
| SOA    | Start of Authority -- zone metadata        | Serial, refresh, retry values   |
| PTR    | Reverse lookup -- IP to name               | \`34.216.184.93 -> www\`          |

#### DNS Security Concerns

DNS was designed in an era of trust and originally had no built-in security. Attackers exploit this through:

- **DNS spoofing/cache poisoning** -- Injecting false records into a resolver's cache to redirect traffic.
- **DNS tunneling** -- Encoding data in DNS queries to exfiltrate information or bypass firewalls.
- **DDoS amplification** -- Using open DNS resolvers to amplify attack traffic.

**DNSSEC** (DNS Security Extensions) adds digital signatures to DNS records, allowing resolvers to verify that responses have not been tampered with.

### DHCP: Automatic Address Assignment

Manually configuring IP addresses on every device is tedious and error-prone. The **Dynamic Host Configuration Protocol (DHCP)** automates this process using a four-step exchange known as **DORA**:

1. **Discover** -- The client broadcasts a DHCPDISCOVER message: "Is there a DHCP server out there?"
2. **Offer** -- The DHCP server responds with a DHCPOFFER: "Here is an available IP address and configuration."
3. **Request** -- The client broadcasts a DHCPREQUEST: "I accept the offer from server X."
4. **Acknowledge** -- The server sends a DHCPACK: "Confirmed. The address is yours for the next [lease duration]."

Along with an IP address, DHCP typically provides the **subnet mask**, **default gateway**, **DNS server addresses**, and the **lease duration** (how long the client can use the address before renewing).

#### DHCP Lease Lifecycle

Addresses are not permanent. At 50% of the lease time, the client attempts to **renew** directly with the server. At 87.5%, if renewal failed, it tries to **rebind** by broadcasting to any DHCP server. If the lease expires without renewal, the client must start the DORA process again.

This lease mechanism ensures addresses are recycled when devices leave the network, preventing address exhaustion.

#### DHCP Relay

DHCP Discover messages are broadcasts, and routers do not forward broadcasts by default. In a multi-subnet network, you either need a DHCP server on every subnet or configure a **DHCP relay agent** (also called an IP helper) on each router. The relay agent forwards DHCP broadcasts as unicast packets to a centralized DHCP server.

Understanding DNS and DHCP deeply will save you countless troubleshooting hours. When users report "the Internet is down," the problem is almost always DNS. When a device gets a \`169.254.x.x\` address (APIPA), DHCP is the culprit.`,
        },
      ],
      quiz: [
        {
          id: 'network-fundamentals__m1__q1',
          question: 'How many layers does the OSI model have?',
          options: ['4', '5', '6', '7'],
          correctIndex: 3,
          explanation:
            'The OSI model has seven layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application.',
        },
        {
          id: 'network-fundamentals__m1__q2',
          question: 'What is the process of adding headers to data as it moves down the network stack called?',
          options: ['De-encapsulation', 'Multiplexing', 'Encapsulation', 'Segmentation'],
          correctIndex: 2,
          explanation:
            'Encapsulation is the process where each layer adds its own header (and sometimes trailer) to the data received from the layer above.',
        },
        {
          id: 'network-fundamentals__m1__q3',
          question: 'Which subnet mask corresponds to a /26 prefix length?',
          options: ['255.255.255.128', '255.255.255.192', '255.255.255.224', '255.255.255.240'],
          correctIndex: 1,
          explanation:
            'A /26 prefix means 26 bits are set to 1 in the subnet mask. The fourth octet has 2 bits set: 128 + 64 = 192, giving 255.255.255.192.',
        },
        {
          id: 'network-fundamentals__m1__q4',
          question: 'Which transport protocol uses a three-way handshake to establish connections?',
          options: ['UDP', 'ICMP', 'TCP', 'ARP'],
          correctIndex: 2,
          explanation:
            'TCP uses the SYN, SYN-ACK, ACK three-way handshake to establish a reliable connection before data transfer begins.',
        },
        {
          id: 'network-fundamentals__m1__q5',
          question: 'What does a DHCP server provide to clients during the DORA process?',
          options: [
            'Only an IP address',
            'An IP address, subnet mask, default gateway, and DNS server addresses',
            'Only a MAC address',
            'A domain name and SSL certificate',
          ],
          correctIndex: 1,
          explanation:
            'DHCP provides a complete network configuration including IP address, subnet mask, default gateway, DNS servers, and a lease duration.',
        },
        {
          id: 'network-fundamentals__m1__q6',
          question: 'Which DNS record type maps a domain name to an IPv4 address?',
          options: ['AAAA', 'CNAME', 'MX', 'A'],
          correctIndex: 3,
          explanation:
            'An A record (Address record) maps a domain name to an IPv4 address. AAAA records are used for IPv6 addresses.',
        },
      ],
    },

    // ── Module 2: Routing & Switching ─────────────────────────────────
    {
      id: 'network-fundamentals__m2',
      title: 'Routing & Switching',
      description:
        'Learn how switches build MAC address tables and forward frames at Layer 2, and how routers use routing tables and protocols to forward packets across networks at Layer 3.',
      lessons: [
        {
          id: 'network-fundamentals__m2__l1',
          title: 'How Switches Work',
          objectives: [
            'Explain how a switch learns MAC addresses and builds its MAC address table',
            'Describe the difference between flooding, forwarding, and filtering',
            'Identify the benefits of VLANs for network segmentation',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'Switches operate at Layer 2 and use MAC addresses to make forwarding decisions, building their MAC address table dynamically by examining the source address of incoming frames',
            'When a switch does not know the destination MAC address, it floods the frame to all ports except the source port; once it learns the address, it forwards only to the correct port',
            'VLANs create logical broadcast domains within a single physical switch, improving security, performance, and administrative flexibility',
          ],
          content: `## How Switches Work

Switches are the workhorses of local area networks (LANs). They connect devices within the same network segment and operate at **Layer 2 (Data Link)** of the OSI model, making forwarding decisions based on **MAC addresses**.

### The MAC Address Table

Every network interface has a unique **MAC (Media Access Control) address** -- a 48-bit hardware address typically written as six pairs of hexadecimal digits: \`AA:BB:CC:DD:EE:FF\`.

When a switch powers on, its MAC address table (also called a **CAM table** -- Content Addressable Memory) is empty. It populates the table through a learning process:

1. **Frame arrives** on port 1 with source MAC \`AA:BB:CC:11:22:33\`.
2. The switch records: "MAC \`AA:BB:CC:11:22:33\` is reachable via port 1" with a timestamp.
3. The switch checks the **destination MAC** against its table.
4. If found, it **forwards** the frame only out the matching port.
5. If not found, it **floods** the frame out all ports except the source port.

Over time, as devices communicate, the switch learns where every device is. Entries age out after a configurable period (typically 300 seconds) to handle devices that move or disconnect.

### Flooding, Forwarding, and Filtering

These three actions define switch behavior:

- **Flooding**: Destination MAC unknown -- send the frame out every port except the one it arrived on. Broadcasts (destination \`FF:FF:FF:FF:FF:FF\`) are always flooded.
- **Forwarding**: Destination MAC is in the table and maps to a different port -- send the frame only out that specific port.
- **Filtering**: Destination MAC is in the table and maps to the same port the frame arrived on -- the switch drops the frame because the sender and receiver are on the same segment.

### Hubs vs. Switches

Older **hubs** simply repeated incoming signals to every port, creating a single **collision domain**. Every device shared the same bandwidth and could only transmit one at a time. Switches eliminated this problem. Each switch port is its own collision domain, and devices on different ports can transmit simultaneously. This is why switches dramatically improved network performance.

### VLANs: Virtual Local Area Networks

By default, all switch ports belong to the same **broadcast domain**. Every broadcast frame reaches every connected device. In a large network, this wastes bandwidth and creates security risks.

**VLANs** solve this by creating **logical broadcast domains** within a single physical switch:

- VLAN 10: Accounting (ports 1-8)
- VLAN 20: Engineering (ports 9-16)
- VLAN 30: Guest Wi-Fi (ports 17-20)

Devices in VLAN 10 cannot see broadcasts from VLAN 20, even though they are on the same switch. To communicate between VLANs, traffic must pass through a **router** or **Layer 3 switch** -- this is called **inter-VLAN routing**.

#### Trunk Ports

When VLANs span multiple switches, you need **trunk links**. A trunk port carries traffic for multiple VLANs over a single physical connection. The switch tags each frame with a **VLAN ID** using the **802.1Q** standard -- a 4-byte tag inserted into the Ethernet frame header. The receiving switch reads the tag and delivers the frame to the correct VLAN.

### Spanning Tree Protocol (STP)

Redundant links between switches prevent a single point of failure, but they introduce a dangerous problem: **switching loops**. A broadcast frame in a loop would circulate forever, multiplying each time, until the network crashes.

**Spanning Tree Protocol (STP -- IEEE 802.1D)** prevents loops by:

1. Electing a **root bridge** (the switch with the lowest bridge ID).
2. Calculating the shortest path from every other switch to the root.
3. Placing redundant ports into a **blocking** state -- they do not forward traffic.
4. If an active link fails, a blocked port transitions to forwarding, restoring connectivity.

Modern networks use **Rapid STP (RSTP -- 802.1w)** which converges in seconds rather than the original STP's 30-50 seconds.

Understanding switch operation is essential because virtually every wired connection in an enterprise passes through a switch. When a user reports they cannot reach the network, the first question is often: "Is the port up, and is it in the right VLAN?"`,
        },
        {
          id: 'network-fundamentals__m2__l2',
          title: 'Router Fundamentals and the Routing Table',
          objectives: [
            'Explain the role of a router in connecting different networks',
            'Read and interpret a basic routing table',
            'Distinguish between connected, static, and dynamic routes',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'Routers operate at Layer 3 and forward packets between different IP networks by consulting their routing table to determine the best next hop',
            'A routing table contains destination networks, subnet masks, next-hop addresses or exit interfaces, metrics, and the source of each route (connected, static, or dynamic)',
            'Connected routes are automatically added for directly attached networks, static routes are manually configured, and dynamic routes are learned via routing protocols',
            'The longest prefix match rule determines which route is selected when multiple entries match a destination',
          ],
          content: `## Router Fundamentals and the Routing Table

While switches connect devices within the same network, **routers** connect different networks together. Every time you access a website, your data passes through multiple routers on its journey. Understanding how routers make forwarding decisions is fundamental to networking.

### What a Router Does

A router operates at **Layer 3 (Network)** and makes decisions based on **IP addresses**. When a packet arrives, the router:

1. Examines the **destination IP address** in the packet header.
2. Consults its **routing table** to find the best path to that destination.
3. Forwards the packet out the appropriate interface toward the **next hop**.
4. Decrements the **TTL (Time to Live)** field by 1. If TTL reaches 0, the router drops the packet and sends an ICMP "Time Exceeded" message back to the source. This prevents packets from circling the network forever.

Each router interface connects to a different network and has its own IP address on that network. A router with two interfaces -- one on \`192.168.1.0/24\` and one on \`10.0.0.0/24\` -- acts as the gateway between those two networks.

### Reading a Routing Table

A routing table is the roadmap a router uses. Here is a simplified example:

\`\`\`
Type    Destination       Next Hop        Interface    Metric
C       192.168.1.0/24    Directly connected  Gig0/0   0
C       10.0.0.0/24       Directly connected  Gig0/1   0
S       172.16.0.0/16     10.0.0.2            Gig0/1   1
O       10.1.1.0/24       10.0.0.3            Gig0/1   20
O       10.2.2.0/24       10.0.0.3            Gig0/1   30
S*      0.0.0.0/0         10.0.0.1            Gig0/1   1
\`\`\`

Each entry contains:
- **Type**: How the route was learned -- C (Connected), S (Static), O (OSPF), S* (default static route).
- **Destination**: The network and prefix length the route reaches.
- **Next Hop**: The IP address of the next router in the path.
- **Interface**: The local interface to send the packet out.
- **Metric**: A value indicating route "cost." Lower is better.

### Connected Routes

When you configure an IP address on a router interface and bring it up, the router automatically adds a **connected route** for that network. These routes have the highest trust because the router knows firsthand that the network is directly attached.

### Static Routes

**Static routes** are manually configured by a network administrator:

\`\`\`
ip route 172.16.0.0 255.255.0.0 10.0.0.2
\`\`\`

This tells the router: "To reach the 172.16.0.0/16 network, forward packets to 10.0.0.2."

Static routes are simple and predictable, making them ideal for small networks or specific paths that should never change. However, they do not adapt to failures -- if the next-hop router goes down, you must manually update the route.

A **default static route** (\`0.0.0.0/0\`) is the "route of last resort." If no other routing table entry matches the destination, the router uses this route. Think of it as "when in doubt, send it here."

### Dynamic Routes

**Dynamic routing protocols** allow routers to automatically discover networks and adapt to changes. When a link fails, routers exchange updates and calculate new paths without human intervention. Major protocols include:

- **RIP (Routing Information Protocol)** -- simple but limited; uses hop count as its metric (max 15 hops).
- **OSPF (Open Shortest Path First)** -- link-state protocol that builds a complete topology map and uses Dijkstra's algorithm to find shortest paths.
- **EIGRP (Enhanced Interior Gateway Routing Protocol)** -- Cisco-developed hybrid protocol with fast convergence.
- **BGP (Border Gateway Protocol)** -- the routing protocol of the Internet; connects autonomous systems (ISPs, large enterprises).

### The Longest Prefix Match

When multiple routes match a destination, the router selects the one with the **longest prefix** (most specific match). For a packet destined for \`10.1.1.50\`:

- \`10.0.0.0/8\` matches (8 bits)
- \`10.1.0.0/16\` matches (16 bits)
- \`10.1.1.0/24\` matches (24 bits) -- **this wins**

The longest prefix match ensures traffic takes the most specific, and therefore most accurate, path.

### Administrative Distance

When different sources (static, OSPF, RIP) all provide a route to the same destination, **administrative distance (AD)** breaks the tie. Lower AD = more trusted:

| Source     | AD  |
|------------|-----|
| Connected  | 0   |
| Static     | 1   |
| EIGRP      | 90  |
| OSPF       | 110 |
| RIP        | 120 |

If both OSPF and RIP provide a route to \`10.1.1.0/24\`, the router installs the OSPF route because its AD (110) is lower than RIP's (120).`,
        },
        {
          id: 'network-fundamentals__m2__l3',
          title: 'Dynamic Routing Protocols: OSPF and BGP',
          objectives: [
            'Describe how OSPF builds its link-state database and calculates shortest paths',
            'Explain the role of BGP in routing traffic between autonomous systems on the Internet',
            'Identify when to use interior vs. exterior gateway protocols',
          ],
          estimatedMinutes: 25,
          keyTakeaways: [
            'OSPF is a link-state interior gateway protocol where every router builds a complete topology map of its area and uses Dijkstra\'s algorithm to calculate the shortest path tree',
            'BGP is the exterior gateway protocol that glues the Internet together, allowing autonomous systems like ISPs to exchange routing information based on policies rather than just metrics',
            'Interior gateway protocols (OSPF, EIGRP, RIP) route within an organization, while exterior gateway protocols (BGP) route between organizations',
          ],
          content: `## Dynamic Routing Protocols: OSPF and BGP

Static routes work for small, stable networks, but as networks grow, manually maintaining routes becomes impossible. Dynamic routing protocols automate the process, enabling routers to discover networks, share topology information, and adapt to failures in seconds.

### Interior vs. Exterior Gateway Protocols

Routing protocols fall into two categories:

- **Interior Gateway Protocols (IGPs)** -- used within a single organization or **autonomous system (AS)**. Examples: OSPF, EIGRP, RIP.
- **Exterior Gateway Protocols (EGPs)** -- used between autonomous systems. In practice, this means **BGP**, which is the only EGP in use today.

An autonomous system is a network or group of networks under a single administrative authority. Your company's network is an AS. Your ISP's network is another AS. BGP connects them all.

### OSPF: Open Shortest Path First

OSPF is the most widely deployed IGP in enterprise networks. Unlike distance-vector protocols like RIP (which only share their routing table with neighbors), OSPF is a **link-state** protocol. Every router builds a complete picture of the network topology.

#### How OSPF Works

1. **Neighbor discovery**: OSPF routers send **Hello packets** on their interfaces (multicast address 224.0.0.5) to discover other OSPF routers. Two routers become neighbors when they agree on key parameters: area ID, hello/dead timers, subnet mask, and authentication.

2. **Adjacency formation**: Among neighbors, certain pairs form **full adjacencies** and exchange detailed topology information. On multi-access networks (like Ethernet), a **Designated Router (DR)** and **Backup DR (BDR)** are elected to reduce the amount of flooding.

3. **Link-State Advertisements (LSAs)**: Each router generates LSAs describing its directly connected links -- their networks, costs, and states. These LSAs are **flooded** throughout the area so every router has the same information.

4. **Link-State Database (LSDB)**: Every router stores all received LSAs in its LSDB. Within an area, all routers have **identical LSDBs** -- this is a key OSPF principle.

5. **SPF Calculation**: Each router runs **Dijkstra's Shortest Path First algorithm** on its LSDB to build a shortest path tree with itself as the root. The result populates the routing table.

#### OSPF Areas

Large OSPF networks are divided into **areas** to limit the scope of LSA flooding and reduce CPU/memory usage. **Area 0** (the backbone) is mandatory, and all other areas must connect to it. Common designs include:

- **Single-area OSPF**: All routers in Area 0. Simple but does not scale beyond roughly 50-100 routers.
- **Multi-area OSPF**: Area 0 as the backbone, with departments or sites in separate areas (Area 1, Area 2, etc.). **Area Border Routers (ABRs)** summarize routes between areas.

#### OSPF Cost Metric

OSPF calculates route cost based on **interface bandwidth**. The default formula is:

\`Cost = Reference Bandwidth / Interface Bandwidth\`

With a reference bandwidth of 100 Mbps:
- 10 Mbps link: cost = 10
- 100 Mbps link: cost = 1
- 1 Gbps link: cost = 1 (identical to 100 Mbps -- a known issue)

Modern networks set the reference bandwidth to 10 Gbps or 100 Gbps to differentiate between fast links: \`auto-cost reference-bandwidth 10000\`.

### BGP: Border Gateway Protocol

If OSPF is the routing protocol inside your office building, **BGP** is the routing protocol for the entire Internet. It connects over 70,000 autonomous systems worldwide.

#### How BGP Differs

BGP is a **path-vector** protocol. Instead of calculating shortest paths based on link costs, BGP routers exchange the **full AS path** -- the sequence of autonomous systems a route traverses. This path information allows:

- **Loop prevention**: If a router sees its own AS number in the path, it rejects the route.
- **Policy-based routing**: Administrators can prefer routes based on business relationships, not just technical metrics.

#### eBGP and iBGP

- **eBGP (external BGP)**: Sessions between routers in different autonomous systems. This is how ISPs exchange routes with each other and with customers.
- **iBGP (internal BGP)**: Sessions between routers within the same AS. Used to distribute externally learned routes throughout the organization.

#### BGP Decision Process

When a BGP router receives multiple paths to the same destination, it evaluates them through a multi-step decision process:

1. Highest **weight** (Cisco-specific, local to the router)
2. Highest **local preference** (shared within the AS)
3. Locally originated routes preferred
4. Shortest **AS path**
5. Lowest **origin type** (IGP < EGP < incomplete)
6. Lowest **MED** (Multi-Exit Discriminator -- a hint from a neighboring AS)
7. eBGP over iBGP
8. Lowest **IGP metric** to the next hop
9. Oldest route
10. Lowest **router ID**

This complex process gives administrators fine-grained control over traffic flow -- essential for organizations with multiple Internet connections.

#### Why BGP Matters

Every time a major cloud provider or ISP has a BGP misconfiguration, significant portions of the Internet can go offline. BGP hijacking -- where an AS falsely announces routes to steal traffic -- remains a real security concern. Understanding BGP is essential for anyone working in enterprise or service provider networking.`,
        },
        {
          id: 'network-fundamentals__m2__l4',
          title: 'Network Address Translation and Access Control Lists',
          objectives: [
            'Explain how NAT allows private networks to access the Internet using shared public addresses',
            'Differentiate between static NAT, dynamic NAT, and PAT',
            'Configure and interpret basic access control lists for traffic filtering',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'NAT translates private IP addresses to public ones, with PAT (Port Address Translation) being the most common form, allowing hundreds of devices to share a single public IP by using unique port numbers',
            'Static NAT provides a one-to-one mapping for servers that need consistent public addresses, while dynamic NAT and PAT are used for outbound client traffic',
            'Access Control Lists (ACLs) filter traffic based on source/destination addresses, protocols, and ports, and are processed top-down with an implicit deny at the end',
          ],
          content: `## Network Address Translation and Access Control Lists

Two technologies you will encounter on virtually every enterprise router are **NAT** and **ACLs**. NAT solves the IPv4 address shortage, and ACLs provide basic traffic filtering and security.

### Network Address Translation (NAT)

With only 4.3 billion IPv4 addresses and billions of connected devices, there are not enough public addresses to go around. **NAT** allows entire private networks to share a small number of public addresses.

#### How NAT Works

When an internal device (\`192.168.1.50\`) sends a packet to an Internet server:

1. The packet reaches the NAT router with source IP \`192.168.1.50\`.
2. The router replaces the source IP with its own **public address** (say, \`203.0.113.10\`) and records the mapping in its **NAT translation table**.
3. The server receives the packet and sees \`203.0.113.10\` as the source.
4. The server responds to \`203.0.113.10\`.
5. The NAT router looks up the mapping, replaces the destination IP with \`192.168.1.50\`, and forwards the packet internally.

#### Types of NAT

**Static NAT** creates a permanent one-to-one mapping between a private and public address. This is used for servers that must be reachable from the Internet with a consistent address:

\`\`\`
ip nat inside source static 192.168.1.10 203.0.113.50
\`\`\`

**Dynamic NAT** maps private addresses to a **pool** of public addresses on a first-come, first-served basis. When all public addresses are in use, additional connections are dropped. This is rarely used today because it wastes public addresses.

**PAT (Port Address Translation)** -- also called **NAT overload** -- is what your home router uses. It maps many private addresses to a **single public address** by using unique **source port numbers** to distinguish connections:

| Internal Address    | Public Address         |
|---------------------|------------------------|
| 192.168.1.50:43210  | 203.0.113.10:10001     |
| 192.168.1.51:43211  | 203.0.113.10:10002     |
| 192.168.1.52:51000  | 203.0.113.10:10003     |

Since port numbers range from 0 to 65,535, a single public IP can support tens of thousands of simultaneous connections.

#### NAT Terminology

- **Inside local**: The private IP of the internal device (\`192.168.1.50\`).
- **Inside global**: The public IP representing the internal device (\`203.0.113.10\`).
- **Outside local**: How the external server appears from inside (usually the same as outside global).
- **Outside global**: The real public IP of the external server (\`93.184.216.34\`).

### Access Control Lists (ACLs)

An **Access Control List** is an ordered set of rules that permit or deny traffic based on various criteria. ACLs are the first line of defense on a router, controlling what traffic enters or leaves an interface.

#### Standard ACLs

Standard ACLs filter traffic based on **source IP address only**:

\`\`\`
access-list 10 permit 192.168.1.0 0.0.0.255
access-list 10 deny any
\`\`\`

The second line is technically unnecessary because all ACLs end with an **implicit deny any** -- but writing it explicitly improves readability.

The \`0.0.0.255\` is a **wildcard mask**, the inverse of a subnet mask. Where a subnet mask uses 1s for the network portion, a wildcard uses 0s for bits that must match and 1s for bits that are ignored.

#### Extended ACLs

Extended ACLs can filter on source IP, destination IP, protocol, and port numbers:

\`\`\`
access-list 100 permit tcp 192.168.1.0 0.0.0.255 host 10.0.0.5 eq 443
access-list 100 permit icmp any any
access-list 100 deny ip any any log
\`\`\`

This permits HTTPS traffic from the 192.168.1.0 network to server 10.0.0.5, allows ICMP (ping) everywhere, and denies everything else while logging denied packets.

#### ACL Placement Rules

- **Standard ACLs**: Place as **close to the destination** as possible (because they can only match source addresses, placing them near the source might block legitimate traffic to other destinations).
- **Extended ACLs**: Place as **close to the source** as possible (to prevent unwanted traffic from consuming bandwidth across the network).

#### Processing Order

ACL rules are evaluated **top to bottom**. The first matching rule wins, and no further rules are checked. This means:

\`\`\`
access-list 100 deny tcp any host 10.0.0.5 eq 22
access-list 100 permit tcp any host 10.0.0.5 eq 22
\`\`\`

The second rule will **never** be reached. Rule ordering is critical -- always put more specific rules before general ones.

#### Named ACLs

Modern configurations use **named ACLs** for readability and easier editing:

\`\`\`
ip access-list extended WEB-FILTER
  10 permit tcp 192.168.1.0 0.0.0.255 any eq 80
  20 permit tcp 192.168.1.0 0.0.0.255 any eq 443
  30 deny ip any any log
\`\`\`

Sequence numbers (10, 20, 30) allow you to insert rules between existing ones without rewriting the entire ACL.

Together, NAT and ACLs form the backbone of perimeter security on traditional networks. While modern firewalls add stateful inspection, deep packet inspection, and application awareness, the principles of address translation and rule-based filtering remain essential knowledge.`,
        },
      ],
      quiz: [
        {
          id: 'network-fundamentals__m2__q1',
          question: 'When a switch receives a frame with an unknown destination MAC address, what does it do?',
          options: [
            'Drops the frame',
            'Sends it back to the source',
            'Floods it out all ports except the source port',
            'Forwards it to the default gateway',
          ],
          correctIndex: 2,
          explanation:
            'When the destination MAC is not in the switch\'s MAC address table, it floods the frame out all ports except the one it was received on, allowing the destination device to respond and be learned.',
        },
        {
          id: 'network-fundamentals__m2__q2',
          question: 'What determines which route a router selects when multiple routing table entries match a destination?',
          options: [
            'The route with the lowest metric',
            'The route learned most recently',
            'The longest prefix match (most specific route)',
            'The route with the highest administrative distance',
          ],
          correctIndex: 2,
          explanation:
            'The longest prefix match rule selects the most specific route. A /24 route will be preferred over a /16 route for the same destination because it is more precise.',
        },
        {
          id: 'network-fundamentals__m2__q3',
          question: 'Which routing protocol is used to exchange routes between autonomous systems on the Internet?',
          options: ['OSPF', 'EIGRP', 'RIP', 'BGP'],
          correctIndex: 3,
          explanation:
            'BGP (Border Gateway Protocol) is the only exterior gateway protocol in use today and is responsible for routing between autonomous systems that make up the Internet.',
        },
        {
          id: 'network-fundamentals__m2__q4',
          question: 'What type of NAT allows many internal devices to share a single public IP address?',
          options: ['Static NAT', 'Dynamic NAT', 'PAT (Port Address Translation)', 'Bi-directional NAT'],
          correctIndex: 2,
          explanation:
            'PAT (also called NAT overload) uses unique source port numbers to map many private addresses to a single public IP address, supporting thousands of simultaneous connections.',
        },
        {
          id: 'network-fundamentals__m2__q5',
          question: 'What happens when a packet does not match any rule in an ACL?',
          options: [
            'It is permitted by default',
            'It is denied by the implicit deny any at the end',
            'It is sent to the default gateway',
            'The router prompts the administrator',
          ],
          correctIndex: 1,
          explanation:
            'Every ACL ends with an implicit "deny any" rule. If a packet does not match any explicitly configured rule, it is dropped.',
        },
        {
          id: 'network-fundamentals__m2__q6',
          question: 'In OSPF, what algorithm does each router use to calculate the shortest path tree?',
          options: [
            'Bellman-Ford algorithm',
            'Dijkstra\'s algorithm',
            'Floyd-Warshall algorithm',
            'Round-robin algorithm',
          ],
          correctIndex: 1,
          explanation:
            'OSPF uses Dijkstra\'s Shortest Path First (SPF) algorithm, which each router runs independently on its link-state database to build a shortest path tree with itself as the root.',
        },
      ],
    },

    // ── Module 3: Wireless Networks ───────────────────────────────────
    {
      id: 'network-fundamentals__m3',
      title: 'Wireless Networks',
      description:
        'Explore Wi-Fi standards, radio frequency fundamentals, wireless security protocols, and best practices for designing and deploying enterprise wireless networks.',
      lessons: [
        {
          id: 'network-fundamentals__m3__l1',
          title: 'Wi-Fi Standards and Radio Frequency Basics',
          objectives: [
            'Identify major Wi-Fi standards (802.11a/b/g/n/ac/ax) and their key characteristics',
            'Explain the difference between 2.4 GHz and 5 GHz frequency bands',
            'Describe how channels, bandwidth, and interference affect wireless performance',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'Wi-Fi standards have evolved from 802.11b (11 Mbps) through 802.11ax/Wi-Fi 6 (9.6 Gbps theoretical), with each generation improving speed, range, and efficiency',
            'The 2.4 GHz band offers better range and wall penetration but has only three non-overlapping channels and significant interference, while 5 GHz offers more channels and less congestion but shorter range',
            'Channel width, interference from neighboring networks and appliances, and the number of spatial streams all directly impact real-world wireless throughput',
          ],
          content: `## Wi-Fi Standards and Radio Frequency Basics

Wireless networking has become the primary connection method for most devices. Understanding Wi-Fi standards and the radio frequency (RF) environment they operate in is essential for designing networks that actually deliver the performance users expect.

### The Evolution of Wi-Fi Standards

The IEEE 802.11 family defines wireless LAN standards. The Wi-Fi Alliance introduced simplified naming starting with Wi-Fi 4:

| Standard   | Wi-Fi Name | Year | Max Speed    | Frequency      | Key Innovation                |
|------------|------------|------|-------------|----------------|-------------------------------|
| 802.11b    | --         | 1999 | 11 Mbps     | 2.4 GHz        | First widely adopted standard |
| 802.11a    | --         | 1999 | 54 Mbps     | 5 GHz          | Higher speed, less interference|
| 802.11g    | --         | 2003 | 54 Mbps     | 2.4 GHz        | Combined b's range with a's speed|
| 802.11n    | Wi-Fi 4   | 2009 | 600 Mbps    | 2.4 & 5 GHz   | MIMO (multiple antennas)      |
| 802.11ac   | Wi-Fi 5   | 2013 | 6.9 Gbps    | 5 GHz          | MU-MIMO, wider channels       |
| 802.11ax   | Wi-Fi 6   | 2020 | 9.6 Gbps    | 2.4 & 5 GHz   | OFDMA, better dense environments|
| 802.11ax   | Wi-Fi 6E  | 2021 | 9.6 Gbps    | 2.4, 5, & 6 GHz| 6 GHz band added             |

Note that maximum speeds are theoretical. Real-world throughput is typically 50-70% of the advertised maximum due to overhead, interference, and distance.

### Understanding Frequency Bands

#### 2.4 GHz Band

The 2.4 GHz band spans from 2.400 to 2.4835 GHz. It is divided into **14 channels** (13 in most countries, 11 in the US), each 22 MHz wide. However, only **channels 1, 6, and 11** are non-overlapping. Using channels 2-5 or 7-10 causes **co-channel interference** with adjacent networks.

Advantages of 2.4 GHz:
- **Better range** -- lower frequencies travel farther and penetrate walls more effectively.
- **Universal device support** -- every Wi-Fi device supports 2.4 GHz.

Disadvantages:
- **Only 3 non-overlapping channels** -- in dense environments like apartment buildings, all three channels may be congested.
- **Interference from non-Wi-Fi devices** -- microwaves, Bluetooth, baby monitors, and cordless phones all operate near 2.4 GHz.

#### 5 GHz Band

The 5 GHz band offers significantly more spectrum, with **25 non-overlapping 20 MHz channels** in the US (varies by region). Channels are grouped into UNII bands (UNII-1, UNII-2, UNII-2 Extended, UNII-3).

Advantages:
- **Less congestion** -- more channels mean fewer overlapping networks.
- **Wider channel options** -- channels can be bonded to 40, 80, or 160 MHz for higher throughput.
- **Less interference** -- fewer consumer devices operate in this band.

Disadvantages:
- **Shorter range** -- higher frequencies attenuate faster, especially through walls.
- **DFS channels** -- some 5 GHz channels overlap with weather radar and require **Dynamic Frequency Selection**, which can cause temporary channel changes.

### Channel Width and Throughput

Channel width directly affects speed and capacity:

| Width  | Theoretical Benefit | Trade-off                          |
|--------|--------------------|------------------------------------|
| 20 MHz | Baseline speed     | Most channels available            |
| 40 MHz | ~2x speed          | Halves available channels          |
| 80 MHz | ~4x speed          | Quarters available channels        |
| 160 MHz| ~8x speed          | Very few channels, high interference risk |

In practice, **20 MHz channels are recommended for 2.4 GHz** (you only have three non-overlapping choices). For 5 GHz in enterprise environments, **40 or 80 MHz** is common.

### MIMO and Spatial Streams

**MIMO (Multiple-Input, Multiple-Output)** uses multiple antennas to send and receive several data streams simultaneously. A "3x3" access point has three transmit and three receive antennas, supporting up to three spatial streams.

**MU-MIMO (Multi-User MIMO)**, introduced in Wi-Fi 5, allows the access point to communicate with multiple clients simultaneously rather than one at a time. Wi-Fi 6 extended MU-MIMO to support both downlink and uplink.

### OFDMA: Wi-Fi 6's Game Changer

**Orthogonal Frequency Division Multiple Access (OFDMA)**, borrowed from LTE cellular technology, divides each channel into smaller sub-channels called **Resource Units (RUs)**. This allows the access point to serve multiple clients in a single transmission, dramatically improving efficiency in dense environments like stadiums, conference centers, and open-plan offices.

Think of it this way: without OFDMA, the access point must send a full-size delivery truck even for a small package. With OFDMA, it can load packages for multiple recipients onto the same truck, making much better use of available airtime.`,
        },
        {
          id: 'network-fundamentals__m3__l2',
          title: 'Wireless Security Protocols',
          objectives: [
            'Trace the evolution from WEP through WPA3 and explain why each predecessor was replaced',
            'Describe how WPA2-Enterprise uses 802.1X and RADIUS for authentication',
            'Identify common wireless attacks and the security measures that mitigate them',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'WEP was fundamentally broken due to weak RC4 key management and should never be used; WPA was a temporary fix; WPA2 with AES-CCMP became the standard for over a decade',
            'WPA3 introduces Simultaneous Authentication of Equals (SAE) which protects against offline dictionary attacks and provides forward secrecy, replacing the vulnerable PSK four-way handshake',
            'WPA2/WPA3-Enterprise using 802.1X authentication with a RADIUS server provides per-user credentials and dynamic key generation, making it far more secure than pre-shared keys for organizations',
          ],
          content: `## Wireless Security Protocols

Wireless signals travel through the air and can be intercepted by anyone within range. Securing wireless networks has been an evolving challenge, with each generation of security protocols addressing the vulnerabilities of its predecessor.

### The Evolution of Wireless Security

#### WEP (Wired Equivalent Privacy) -- 1999

WEP was the original Wi-Fi security standard, and it was catastrophically flawed. It used the **RC4 stream cipher** with a 24-bit **Initialization Vector (IV)**. The problems:

- The IV space was so small (16.7 million values) that IVs were reused quickly on busy networks.
- Reused IVs allowed attackers to derive the encryption key.
- Tools like **aircrack-ng** can crack a WEP key in minutes by passively capturing traffic.

**Never use WEP.** It provides essentially no security.

#### WPA (Wi-Fi Protected Access) -- 2003

WPA was a stopgap while the full 802.11i standard (WPA2) was being finalized. It improved on WEP with:

- **TKIP (Temporal Key Integrity Protocol)** -- per-packet key mixing, a longer IV, and a message integrity check.
- **Dynamic key generation** -- keys change with each packet.

TKIP was designed to run on existing WEP hardware, which limited its strength. TKIP has since been deprecated due to discovered vulnerabilities.

#### WPA2 -- 2004

WPA2 implemented the full IEEE 802.11i standard and replaced TKIP with:

- **AES-CCMP (Advanced Encryption Standard - Counter Mode with CBC-MAC Protocol)** -- a far stronger encryption algorithm.
- **Mandatory AES support** in hardware.

WPA2 remained the gold standard for over 15 years. Its main vulnerability was discovered in 2017 -- the **KRACK (Key Reinstallation Attack)**, which exploited the four-way handshake to reinstall encryption keys.

#### WPA3 -- 2018

WPA3 addresses WPA2's remaining weaknesses:

- **SAE (Simultaneous Authentication of Equals)** replaces the PSK four-way handshake. SAE is based on the Dragonfly key exchange, which provides:
  - **Protection against offline dictionary attacks** -- an attacker who captures the handshake cannot run an offline brute-force attack against the password.
  - **Forward secrecy** -- if the password is eventually compromised, previously captured traffic cannot be decrypted.
- **192-bit security suite** (WPA3-Enterprise) for government and financial networks.
- **Enhanced Open (OWE -- Opportunistic Wireless Encryption)** provides encryption even on open networks (like coffee shops) without requiring a password.

### Personal vs. Enterprise Authentication

#### WPA2/WPA3-Personal (PSK)

In personal mode, all users share a single **Pre-Shared Key (PSK)** -- the Wi-Fi password. This is simple to set up but has significant drawbacks:

- If one person shares the password, everyone is compromised.
- When an employee leaves, you must change the password and redistribute it to all remaining users.
- All users share the same encryption key material.

#### WPA2/WPA3-Enterprise (802.1X)

Enterprise mode uses the **IEEE 802.1X** framework with a **RADIUS server** (Remote Authentication Dial-In User Service) to provide individual authentication:

1. The client (supplicant) connects to the access point (authenticator).
2. The AP passes the authentication request to the RADIUS server.
3. The RADIUS server verifies the user's credentials (username/password, certificate, or both) using an **EAP (Extensible Authentication Protocol)** method.
4. Upon successful authentication, unique encryption keys are generated for that session.

Common EAP methods:
- **EAP-TLS**: Both server and client present certificates. Most secure but requires a PKI infrastructure.
- **PEAP (Protected EAP)**: Server presents a certificate, client authenticates with username/password inside a TLS tunnel.
- **EAP-TTLS**: Similar to PEAP, widely supported on non-Windows devices.

Enterprise authentication means every user has unique credentials, access can be revoked individually, and per-user encryption keys prevent one user from decrypting another's traffic.

### Common Wireless Attacks

**Evil twin / rogue AP**: An attacker sets up an access point with the same SSID as a legitimate network. Devices connect automatically, and the attacker intercepts all traffic. **Mitigation**: Wireless intrusion detection systems (WIDS), 802.1X authentication, and client certificate validation.

**Deauthentication attacks**: The attacker sends forged deauthentication frames to disconnect clients, forcing them to reconnect (potentially to a rogue AP). **Mitigation**: 802.11w (Management Frame Protection), which is mandatory in WPA3.

**Credential capture**: On WPA2-Personal networks, the four-way handshake can be captured and subjected to offline brute-force attacks. **Mitigation**: Use WPA3-SAE or WPA2-Enterprise; if using PSK, choose a long, random passphrase.

**KARMA/MANA attacks**: Exploit client probe requests to lure devices to malicious access points. **Mitigation**: Configure devices not to auto-connect to open networks; use VPNs on untrusted networks.

Wireless security is not a set-it-and-forget-it proposition. Regular audits, firmware updates, strong authentication, and user education are all essential components of a secure wireless deployment.`,
        },
        {
          id: 'network-fundamentals__m3__l3',
          title: 'Enterprise Wireless Design',
          objectives: [
            'Plan access point placement using site survey data and coverage requirements',
            'Explain the role of wireless LAN controllers in managing enterprise access points',
            'Design a channel plan that minimizes co-channel interference',
          ],
          estimatedMinutes: 25,
          keyTakeaways: [
            'Effective wireless design starts with a site survey to map coverage, identify dead zones, and measure interference before placing any access points',
            'Wireless LAN controllers centralize configuration, monitoring, and roaming management for lightweight access points, significantly simplifying enterprise deployments',
            'A good channel plan assigns non-overlapping channels to adjacent access points and balances coverage with capacity to ensure consistent performance throughout the facility',
            'Cell overlap of 15-25% between adjacent APs ensures seamless roaming without creating excessive co-channel interference',
          ],
          content: `## Enterprise Wireless Design

Designing a wireless network for an office, warehouse, or campus is fundamentally different from setting up a home router. Enterprise environments demand consistent coverage, high capacity, seamless roaming, and centralized management. Good design requires planning before a single access point is mounted.

### The Site Survey

A **site survey** is the foundation of every successful wireless deployment. There are three types:

#### Predictive Survey
Using software tools like Ekahau or iBwave, you input floor plans, wall materials, and AP models to **simulate** coverage. This provides a starting point but cannot account for every real-world variable.

#### Passive Survey
Walk through the facility with a survey tool that **listens** to existing wireless signals. This reveals:
- Current coverage levels and dead zones
- Interference from neighboring networks
- Signal strength at different locations
- Channel utilization

#### Active Survey
Connect to the network and measure **actual performance** -- throughput, latency, packet loss, and roaming behavior. This validates that the design meets real-world requirements.

**Best practice**: Start with a predictive survey for initial AP placement, then validate with passive and active surveys after installation.

### Access Point Placement Principles

**Coverage vs. Capacity**: In a hallway, you need coverage over a long, narrow area -- fewer APs placed farther apart. In a conference room with 50 users, you need capacity -- more APs placed closer together, possibly with directional antennas.

**Height and orientation**: Mount APs on the ceiling, antenna-side down. The typical recommended height is 3-4.5 meters (10-15 feet). Mounting too high wastes signal on areas below adjacent rooms rather than the intended coverage area.

**Building materials matter**: Different materials attenuate Wi-Fi signals differently:

| Material          | Approximate Attenuation (per wall) |
|-------------------|------------------------------------|
| Drywall           | 3-5 dB                            |
| Glass (standard)  | 3-4 dB                            |
| Concrete block    | 10-15 dB                          |
| Brick             | 8-12 dB                           |
| Metal             | 15-25 dB                          |
| Elevator shaft    | 25-40 dB                          |

A signal loses about 3 dB passing through drywall, but a concrete wall can reduce it by 15 dB -- the difference between a strong connection and no connection at all.

**Cell overlap**: Adjacent APs should have **15-25% coverage overlap** to ensure clients can roam seamlessly. Too little overlap creates dead zones; too much wastes resources and increases co-channel interference.

### Channel Planning

A channel plan assigns specific channels to each AP to minimize interference:

**2.4 GHz**: Use only channels **1, 6, and 11**. In a grid layout, alternate them so no two adjacent APs share a channel. With only three non-overlapping channels, 2.4 GHz design in dense environments is inherently challenging.

**5 GHz**: With 25+ non-overlapping channels, design is more flexible. Assign channels so that adjacent APs are at least two channels apart. Avoid DFS channels in areas where radar is detected.

**Power level tuning**: Reduce transmit power so each AP covers only its intended area. An AP blasting at full power creates a large cell that overlaps with many neighbors, increasing interference. A common enterprise setting is 10-14 dBm for 5 GHz and 8-11 dBm for 2.4 GHz, though this varies by environment.

### Wireless LAN Controllers

In a small office with three APs, you can configure each one individually. In an enterprise with 200 APs, this is impractical. **Wireless LAN Controllers (WLCs)** solve this with centralized management.

#### Controller-Based Architecture

In this model, APs are **lightweight** -- they do not make independent forwarding decisions. Instead:

1. The AP discovers and joins a WLC (via DHCP option, DNS, or broadcast).
2. The WLC pushes configuration (SSIDs, security settings, channel, power) to the AP.
3. Client data can be **tunneled** through the WLC (centralized forwarding) or **switched locally** at the AP (FlexConnect/local mode).
4. The WLC handles roaming, load balancing, rogue AP detection, and RF management.

#### Cloud-Managed APs

Modern solutions like Cisco Meraki, Aruba Central, and Juniper Mist move the controller to the **cloud**. APs connect to a cloud management platform over the Internet. Benefits include zero-touch provisioning, global visibility, and automatic firmware updates. The trade-off is dependency on Internet connectivity for management (though data forwarding continues locally if the cloud connection drops).

### Roaming

When a client moves from one AP to another, the transition should be invisible to the user. Key roaming standards:

- **802.11r (Fast BSS Transition)**: Pre-authenticates the client with the target AP, reducing handoff time from hundreds of milliseconds to under 50 ms.
- **802.11k (Radio Resource Management)**: The AP provides the client with a list of neighboring APs and their channels, so the client does not have to scan every channel when roaming.
- **802.11v (BSS Transition Management)**: The AP can suggest that a client move to a less congested AP, improving overall network performance.

Together, these standards enable voice and video calls to continue without interruption as users walk through a building.

### Design Documentation

A professional wireless design deliverable includes:
- Floor plan with AP locations, channels, and power levels
- Bill of materials (AP models, mounts, cabling)
- Coverage heat maps showing signal strength at desk height
- Channel plan diagram
- Configuration templates for SSIDs, VLANs, and security policies

Thorough documentation ensures the network can be maintained and expanded by anyone on the team, not just the original designer.`,
        },
        {
          id: 'network-fundamentals__m3__l4',
          title: 'Wireless Troubleshooting and Optimization',
          objectives: [
            'Diagnose common wireless performance problems using systematic methodology',
            'Use wireless analysis tools to identify interference and coverage gaps',
            'Apply optimization techniques to improve throughput and reduce latency',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'Most wireless performance complaints stem from co-channel interference, insufficient coverage, or band steering issues rather than access point hardware failures',
            'Tools like Wi-Fi analyzers, spectrum analyzers, and controller dashboards provide the data needed to diagnose issues objectively rather than guessing',
            'Optimization often involves reducing AP power to shrink cell sizes, enabling band steering to move capable clients to 5 GHz, and ensuring proper QoS configuration for voice and video traffic',
          ],
          content: `## Wireless Troubleshooting and Optimization

"The Wi-Fi is slow" is one of the most common complaints in any organization. Wireless troubleshooting requires a systematic approach because the problem could be anything from a microwave oven to a misconfigured channel plan.

### A Systematic Troubleshooting Approach

Follow a structured methodology rather than randomly changing settings:

**1. Define the problem**: Where is the user? What device? What application? When does it happen? Is it one user or many? Narrowing the scope immediately eliminates large categories of potential causes.

**2. Gather data**: Check the wireless controller dashboard for the AP the user is connected to. Look at:
- **Signal strength (RSSI)**: Below -70 dBm suggests a coverage problem.
- **Signal-to-Noise Ratio (SNR)**: Below 20 dB means the signal is struggling against the noise floor.
- **Channel utilization**: Above 50% indicates the channel is congested.
- **Client data rate**: If a client is connected at 6 Mbps instead of 300 Mbps, something is forcing it to a low rate.
- **Retry rate**: High retry percentages (above 10%) indicate frames are being lost and retransmitted.

**3. Identify the layer**: Is this a Layer 1 (RF) issue, a Layer 2 (association/authentication) issue, or a Layer 3+ (DHCP/DNS/application) issue?

**4. Test and verify**: Make one change at a time and measure the impact.

### Common Wireless Problems and Solutions

#### Co-Channel Interference (CCI)

When two APs on the same channel are close enough that a client hears both, the client must wait for both to finish transmitting before it can send. This **halves effective throughput** or worse.

**Symptoms**: Slow speeds despite good signal strength. High channel utilization. Controller shows neighboring APs on the same channel.

**Fix**: Redesign the channel plan. Reduce AP power to shrink cells. In dense deployments, consider disabling 2.4 GHz on some APs since only three non-overlapping channels are available.

#### Adjacent Channel Interference (ACI)

Using channels 1 and 3 (or 6 and 8) on the 2.4 GHz band causes overlapping signals that corrupt each other. Unlike CCI, where the devices at least understand each other's transmissions, ACI creates unintelligible noise.

**Fix**: Stick to channels 1, 6, and 11 on 2.4 GHz. Never use intermediate channels.

#### Sticky Clients

A client connects to an AP near the elevator and walks to the far end of the building. Despite passing several closer APs, the client stubbornly stays connected to the original AP at very low signal strength.

**Symptoms**: User reports slow speeds. The controller shows the client connected to a distant AP with an RSSI of -80 dBm or worse.

**Fix**: Enable **minimum RSSI thresholds** on APs (deauthenticate clients below -75 dBm). Enable **802.11k/v** so APs can guide clients to better options. Some controllers offer "optimized roaming" features.

#### Non-Wi-Fi Interference

Devices operating in the 2.4 GHz band but not using Wi-Fi can cause significant problems:

- **Microwave ovens**: Generate broadband noise across 2.4 GHz while operating.
- **Bluetooth**: Uses frequency hopping across 2.4 GHz but rarely causes major issues.
- **Wireless cameras and baby monitors**: Older models use fixed-frequency transmitters that can obliterate a Wi-Fi channel.
- **Cordless phones**: Some models use 2.4 GHz or 5.8 GHz.

**Diagnosis**: A **spectrum analyzer** (hardware like Metageek's Wi-Spy or built into enterprise APs) shows non-Wi-Fi energy that a standard Wi-Fi analyzer cannot detect.

**Fix**: Move affected APs to 5 GHz, remove the interfering device, or relocate the AP.

### Wireless Analysis Tools

**Wi-Fi analyzer apps** (InSSIDer, WiFi Analyzer): Show visible SSIDs, signal strengths, channels, and security settings. Great for quick surveys and identifying congestion.

**Spectrum analyzers** (Wi-Spy, AirMagnet Spectrum XT): Show all RF energy, not just Wi-Fi. Essential for identifying non-Wi-Fi interference.

**Packet capture** (Wireshark with a Wi-Fi adapter in monitor mode): Captures raw 802.11 frames. Reveals retransmissions, deauthentication frames, association failures, and protocol-level issues.

**Controller dashboards**: Enterprise WLCs provide per-client statistics, AP health metrics, channel utilization graphs, and rogue AP alerts. Always start here.

### Optimization Best Practices

**Band steering**: Configure APs to encourage dual-band clients to connect on 5 GHz, reserving 2.4 GHz for IoT devices and older hardware. This balances load and gives 5 GHz-capable clients better performance.

**Airtime fairness**: Slow clients consume disproportionate airtime because their frames take longer to transmit. Airtime fairness features allocate equal airtime (not equal frame count) to each client, preventing one slow device from dragging down everyone.

**Quality of Service (QoS)**: Configure WMM (Wi-Fi Multimedia) to prioritize voice (VO) and video (VI) traffic over best-effort (BE) and background (BK) traffic. This is essential for VoIP and video conferencing.

**Rate limiting per SSID**: Guest networks should have bandwidth caps to prevent visitors from consuming all available bandwidth.

**Scheduled scanning**: Configure APs to scan for rogue APs and interference during off-peak hours to minimize impact on production traffic.

**Firmware updates**: Keep AP firmware current. Manufacturers regularly release fixes for performance bugs, security vulnerabilities, and roaming improvements.

The key to wireless optimization is continuous monitoring. Networks change as walls are added, furniture moves, new devices appear, and user density shifts. What worked at deployment may not work six months later.`,
        },
      ],
      quiz: [
        {
          id: 'network-fundamentals__m3__q1',
          question: 'Which three 2.4 GHz channels are non-overlapping and recommended for use?',
          options: ['1, 4, 8', '1, 5, 10', '1, 6, 11', '2, 7, 12'],
          correctIndex: 2,
          explanation:
            'Channels 1, 6, and 11 are the only non-overlapping channels in the 2.4 GHz band. Each is separated by enough frequency space (25 MHz) to avoid adjacent channel interference.',
        },
        {
          id: 'network-fundamentals__m3__q2',
          question: 'What security protocol replaced WEP and uses AES-CCMP encryption?',
          options: ['WPA with TKIP', 'WPA2', 'WEP2', '802.1X'],
          correctIndex: 1,
          explanation:
            'WPA2 implemented the full IEEE 802.11i standard and replaced WEP/TKIP with AES-CCMP, providing strong encryption that remained the standard for over 15 years.',
        },
        {
          id: 'network-fundamentals__m3__q3',
          question: 'What is the recommended coverage overlap between adjacent access points for seamless roaming?',
          options: ['5-10%', '15-25%', '40-50%', '60-75%'],
          correctIndex: 1,
          explanation:
            'A 15-25% coverage overlap ensures clients can roam seamlessly between access points without experiencing dead zones, while avoiding excessive co-channel interference.',
        },
        {
          id: 'network-fundamentals__m3__q4',
          question: 'What technology introduced in Wi-Fi 6 allows an access point to serve multiple clients simultaneously within a single channel?',
          options: ['MIMO', 'OFDMA', 'Beamforming', 'Channel bonding'],
          correctIndex: 1,
          explanation:
            'OFDMA (Orthogonal Frequency Division Multiple Access) divides each channel into smaller resource units, allowing the AP to transmit to multiple clients simultaneously, dramatically improving efficiency in dense environments.',
        },
        {
          id: 'network-fundamentals__m3__q5',
          question: 'What does WPA3-SAE protect against that WPA2-PSK does not?',
          options: [
            'Packet sniffing on the local network',
            'Offline dictionary attacks against captured handshakes',
            'Physical theft of the access point',
            'DNS spoofing attacks',
          ],
          correctIndex: 1,
          explanation:
            'WPA3-SAE (Simultaneous Authentication of Equals) uses the Dragonfly key exchange, which prevents attackers from capturing the handshake and running offline brute-force attacks against the password.',
        },
        {
          id: 'network-fundamentals__m3__q6',
          question: 'When a wireless client shows good signal strength but poor throughput, what is the most likely cause?',
          options: [
            'The client is too close to the access point',
            'Co-channel interference from nearby APs on the same channel',
            'The access point firmware is out of date',
            'The SSID name is too long',
          ],
          correctIndex: 1,
          explanation:
            'Co-channel interference is the most common cause of poor throughput despite good signal strength. When multiple APs share a channel, clients must wait for clear airtime, significantly reducing effective throughput.',
        },
      ],
    },

    // ── Module 4: Network Troubleshooting ─────────────────────────────
    {
      id: 'network-fundamentals__m4',
      title: 'Network Troubleshooting',
      description:
        'Develop systematic troubleshooting skills using industry-standard methodologies, command-line tools, and structured approaches to diagnose and resolve network issues efficiently.',
      lessons: [
        {
          id: 'network-fundamentals__m4__l1',
          title: 'Troubleshooting Methodologies',
          objectives: [
            'Apply the CompTIA seven-step troubleshooting methodology to network problems',
            'Choose between top-down, bottom-up, and divide-and-conquer approaches based on the symptoms',
            'Document troubleshooting steps and resolutions for future reference',
          ],
          estimatedMinutes: 15,
          keyTakeaways: [
            'The CompTIA seven-step methodology (identify, theory, test, plan, implement, verify, document) provides a repeatable framework that prevents random guessing and ensures thorough problem resolution',
            'Bottom-up troubleshooting starts at the physical layer and works up, top-down starts at the application layer and works down, and divide-and-conquer starts at the layer most likely to be the problem based on symptoms',
            'Documentation of every troubleshooting case builds an organizational knowledge base that accelerates resolution of similar future issues',
          ],
          content: `## Troubleshooting Methodologies

The difference between a junior technician and a senior engineer is not just knowledge -- it is **methodology**. Experienced engineers resolve problems faster because they follow a structured approach instead of randomly changing settings.

### The CompTIA Seven-Step Methodology

This framework appears on the Network+ and A+ exams because it works in the real world:

**1. Identify the problem**
- Gather information from the user: What exactly is not working? When did it start? What changed?
- Identify symptoms: Is it one user or many? One site or all sites? Constant or intermittent?
- Duplicate the problem if possible.
- Question users without leading them: "What happens when you try to open the website?" not "Is the Internet down?"

**2. Establish a theory of probable cause**
- Use your knowledge of networking layers to hypothesize.
- Consider the most common causes first (**Occam's Razor**: the simplest explanation is usually correct).
- A user who "cannot access anything" likely has a Layer 1-3 issue. A user who "cannot access one specific application" likely has a Layer 4-7 issue.

**3. Test the theory**
- Perform targeted tests to confirm or disprove your theory.
- If the theory is confirmed, determine the exact cause.
- If the theory is not confirmed, go back to step 2 with a new theory.
- Example: Theory is "the cable is bad." Test: Try a known-good cable. If the problem persists, the cable was not the cause.

**4. Establish a plan of action**
- Once you know the cause, plan the fix.
- Consider the impact: Will the fix cause downtime? Does it require a maintenance window?
- Identify rollback procedures in case the fix creates new problems.
- Get approval from stakeholders if necessary.

**5. Implement the solution**
- Execute the plan.
- Make one change at a time so you can identify which change resolved the issue.
- If multiple changes are needed, implement them in a logical order.

**6. Verify full system functionality**
- Confirm the original problem is resolved.
- Check that the fix did not create new problems (test related systems).
- Have the user verify from their perspective.
- If applicable, implement preventive measures to stop the problem from recurring.

**7. Document findings, actions, and outcomes**
- Record the symptoms, cause, and resolution.
- Update network diagrams if the infrastructure changed.
- Note any lessons learned.
- This documentation becomes invaluable when a similar issue arises in the future.

### Layered Troubleshooting Approaches

#### Bottom-Up

Start at **Layer 1 (Physical)** and work upward:
1. Is the cable connected? Is the link light on?
2. Is the port configured correctly? Is the VLAN right?
3. Does the device have an IP address? Can it ping the gateway?
4. Can it reach the DNS server? Can it resolve names?
5. Is the application responding?

**Best for**: Problems where you have no initial clues or suspect a physical issue.

#### Top-Down

Start at **Layer 7 (Application)** and work downward:
1. Can the user access any website? Try a different browser.
2. Can they ping the server by IP? If yes, DNS is the issue.
3. Can they ping the gateway? If not, it is a Layer 3 issue.
4. Is the link up? Check the NIC status.

**Best for**: Problems where the user can clearly describe application-level symptoms.

#### Divide and Conquer

Start at the **layer most likely to be the problem** based on initial analysis:
- User cannot access one specific server? Start at Layer 3 -- check routing.
- Multiple users on one floor affected? Start at Layer 2 -- check the switch.
- User got a new laptop and nothing works? Start at Layer 1 -- check the cable and port.

**Best for**: Experienced engineers who can quickly assess the most probable layer from symptoms.

### The Importance of Documentation

Every resolved issue should be documented in a knowledge base or ticketing system. A good entry includes:

- **Date and time**
- **Reporter and affected systems**
- **Symptoms described**
- **Troubleshooting steps taken** (including dead ends)
- **Root cause identified**
- **Resolution applied**
- **Preventive measures implemented**
- **Time to resolution**

This documentation has compounding value. Six months from now, when a similar problem occurs, you or a colleague can search the knowledge base and potentially resolve it in minutes instead of hours.`,
        },
        {
          id: 'network-fundamentals__m4__l2',
          title: 'Command-Line Diagnostic Tools',
          objectives: [
            'Use ping, traceroute, and pathping to diagnose connectivity and latency issues',
            'Interpret ipconfig/ifconfig output to verify local network configuration',
            'Apply nslookup and dig to troubleshoot DNS resolution problems',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'ping tests basic Layer 3 connectivity and measures round-trip time; traceroute reveals every router hop between source and destination, identifying where delays or failures occur',
            'ipconfig (Windows) and ifconfig/ip (Linux/Mac) display the local IP configuration including address, subnet mask, gateway, and DNS servers -- always the first place to check',
            'nslookup and dig query DNS servers directly, allowing you to verify whether name resolution is working and identify which specific DNS records are returned or missing',
            'Combining multiple tools in sequence (ipconfig -> ping gateway -> ping external IP -> nslookup -> traceroute) creates a systematic diagnostic workflow',
          ],
          content: `## Command-Line Diagnostic Tools

Every network professional needs to be fluent in command-line diagnostic tools. They are available on every operating system, require no special software, and provide precise information that GUIs often hide.

### ping

The most fundamental tool. \`ping\` sends **ICMP Echo Request** packets to a destination and waits for **Echo Reply** packets.

\`\`\`
C:\\> ping 8.8.8.8

Pinging 8.8.8.8 with 32 bytes of data:
Reply from 8.8.8.8: bytes=32 time=12ms TTL=118
Reply from 8.8.8.8: bytes=32 time=11ms TTL=118
Reply from 8.8.8.8: bytes=32 time=13ms TTL=118
Reply from 8.8.8.8: bytes=32 time=11ms TTL=118
\`\`\`

**What to look for**:
- **"Reply from"**: Connectivity works. Check the **time** (round-trip latency). Under 50 ms is typical for domestic Internet; under 5 ms is typical on a LAN.
- **"Request timed out"**: No response. Could be the destination is down, ICMP is blocked by a firewall, or there is a routing problem.
- **"Destination host unreachable"**: Your own router does not have a path to the destination. Check routing.
- **Intermittent replies**: Packet loss. Even 1-2% packet loss causes noticeable performance degradation, especially for voice and video.
- **TTL value**: Indicates how many routers the packet can still traverse. A low TTL returning suggests the packet traveled through many hops.

**Strategic pinging**: Always ping in order:
1. \`ping 127.0.0.1\` (localhost -- tests the TCP/IP stack itself)
2. \`ping [your IP]\` (tests the local interface)
3. \`ping [default gateway]\` (tests local network connectivity)
4. \`ping [remote IP like 8.8.8.8]\` (tests Internet connectivity)
5. \`ping [domain name]\` (tests DNS resolution + connectivity)

If step 4 works but step 5 fails, you have a DNS problem, not a connectivity problem.

### traceroute / tracert

While ping tells you whether you can reach a destination, **traceroute** shows you the path and identifies where problems occur.

\`\`\`
C:\\> tracert www.google.com

  1    <1 ms    <1 ms    <1 ms  192.168.1.1
  2     5 ms     4 ms     5 ms  10.0.0.1
  3    10 ms    11 ms    10 ms  isp-router.example.com
  4    12 ms    11 ms    12 ms  72.14.215.85
  5    11 ms    12 ms    11 ms  lax17s55-in-f4.1e100.net [142.250.80.36]
\`\`\`

Traceroute works by sending packets with incrementing **TTL values**. The first packet has TTL=1, so the first router decrements it to 0 and sends back a "Time Exceeded" message, revealing its address. The second packet has TTL=2, and so on.

**What to look for**:
- **Sudden large latency jumps**: A hop that goes from 10 ms to 150 ms may indicate congestion or a geographically distant link.
- **Asterisks (\* \* \*)**: The router did not respond. This does not always mean failure -- many routers are configured to drop ICMP to reduce load. If subsequent hops respond normally, the silent hop is not a problem.
- **Consistent timeouts from a specific hop onward**: The problem is likely at or near that hop.

On Linux/Mac, the command is \`traceroute\` (uses UDP by default) vs. Windows \`tracert\` (uses ICMP).

### ipconfig / ifconfig / ip

These commands display the local network configuration:

**Windows**: \`ipconfig /all\` shows IP address, subnet mask, default gateway, DNS servers, DHCP server, MAC address, and lease information.

**Linux**: \`ip addr show\` (modern) or \`ifconfig\` (legacy) shows interface addresses. \`ip route show\` displays the routing table. \`cat /etc/resolv.conf\` shows DNS servers.

**Mac**: \`ifconfig\` works, or use \`networksetup -getinfo "Wi-Fi"\`.

**Key checks**:
- Does the device have an IP address? If it has a \`169.254.x.x\` address (APIPA), DHCP failed.
- Is the subnet mask correct? A wrong mask (e.g., /32 instead of /24) prevents communication with other hosts.
- Is the default gateway set and on the same subnet?
- Are DNS servers configured?

### nslookup and dig

When ping by name fails but ping by IP works, DNS is the culprit. These tools query DNS servers directly:

\`\`\`
C:\\> nslookup www.gasweb.info
Server:  dns.google
Address:  8.8.8.8

Non-authoritative answer:
Name:    www.gasweb.info
Address:  76.76.21.21
\`\`\`

\`dig\` (available on Linux/Mac, installable on Windows) provides more detailed output:

\`\`\`
$ dig www.gasweb.info A

;; ANSWER SECTION:
www.gasweb.info.    300    IN    A    76.76.21.21

;; Query time: 23 msec
;; SERVER: 8.8.8.8#53(8.8.8.8)
\`\`\`

**Useful variations**:
- \`nslookup -type=MX example.com\` -- query mail server records
- \`dig example.com ANY\` -- retrieve all record types
- \`dig @1.1.1.1 example.com\` -- query a specific DNS server
- \`nslookup example.com 8.8.8.8\` -- query Google's DNS specifically

If your configured DNS server returns wrong results but a public DNS server (8.8.8.8, 1.1.1.1) returns correct results, your internal DNS needs attention.

### Other Essential Tools

**arp -a**: Shows the ARP cache -- IP to MAC address mappings. Useful for verifying Layer 2 connectivity and detecting duplicate IP addresses.

**netstat -an** (or \`ss -tuln\` on Linux): Shows active connections and listening ports. Critical for verifying that a service is actually listening on the expected port.

**nmap**: Network scanner that discovers hosts, open ports, and services. Invaluable for verifying firewall rules and service availability (use only on networks you are authorized to scan).

**pathping** (Windows): Combines ping and traceroute, running for 25 seconds at each hop to measure packet loss and latency per hop. Excellent for identifying intermittent problems.`,
        },
        {
          id: 'network-fundamentals__m4__l3',
          title: 'Troubleshooting Common Network Issues',
          objectives: [
            'Diagnose and resolve DHCP, DNS, and default gateway problems',
            'Identify symptoms of duplex mismatches, VLAN misconfigurations, and cable faults',
            'Troubleshoot intermittent connectivity issues caused by network loops or broadcast storms',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'A device with a 169.254.x.x APIPA address indicates DHCP failure; check DHCP server status, scope exhaustion, relay agents, and the path between client and server',
            'Duplex mismatches cause late collisions, poor throughput, and incrementing error counters on switch ports; the fix is to set both ends to the same speed and duplex or use auto-negotiation consistently',
            'Broadcast storms from switching loops can take down an entire VLAN within seconds; Spanning Tree Protocol prevents loops but must be properly configured and not disabled',
          ],
          content: `## Troubleshooting Common Network Issues

Real-world network problems tend to follow recurring patterns. Learning to recognize these patterns and their solutions will resolve the majority of issues you encounter.

### DHCP Problems

**Symptom**: Device has a \`169.254.x.x\` address (APIPA -- Automatic Private IP Addressing). The device could not reach a DHCP server.

**Troubleshooting steps**:

1. **Verify the DHCP server is running**: Check the server's status and event logs. Is the DHCP service started?
2. **Check scope exhaustion**: The DHCP pool may be out of addresses. Review the scope to see how many addresses are available vs. leased. Shorten lease durations or expand the pool.
3. **Verify network path**: Can other devices on the same VLAN get addresses? If not, check the switch port VLAN assignment.
4. **Check DHCP relay**: If the DHCP server is on a different subnet, verify the relay agent (IP helper) is configured on the router interface for the client's VLAN.
5. **Rogue DHCP server**: Another device on the network might be handing out incorrect addresses. Enable DHCP snooping on switches to allow only authorized DHCP servers.

**Symptom**: Device gets an IP address but cannot access the network.

Check whether DHCP is providing the correct **gateway**, **subnet mask**, and **DNS servers**. A common mistake is configuring the wrong gateway address in the DHCP scope.

### DNS Problems

**Symptom**: Cannot browse websites by name but can ping by IP address (e.g., \`ping 8.8.8.8\` works but \`ping google.com\` fails).

**Steps**:
1. Check DNS server configuration: \`ipconfig /all\` -- is a DNS server listed?
2. Test DNS resolution: \`nslookup google.com\` -- does the configured DNS server respond?
3. Try an alternate DNS server: \`nslookup google.com 8.8.8.8\` -- if this works, your primary DNS server is the problem.
4. Check for DNS cache poisoning: \`ipconfig /flushdns\` clears the local cache.
5. Verify DNS server connectivity: Can you ping the DNS server? Is port 53 open?

**Symptom**: Intermittent DNS failures.

Often caused by DNS servers under heavy load or network latency to the DNS server. Configure a secondary DNS server for redundancy.

### Default Gateway Issues

**Symptom**: Device can communicate with local devices but not with anything on other subnets or the Internet.

This is a classic gateway problem:
1. Verify the gateway is configured: \`ipconfig\` should show a gateway address.
2. Verify the gateway is reachable: \`ping [gateway IP]\`.
3. Verify the gateway is on the same subnet: If your IP is \`192.168.1.50/24\` and your gateway is \`10.0.0.1\`, they are on different subnets -- the gateway is unreachable.
4. Check the router: Is the gateway interface up? Does the router have a route to the destination?

### Duplex and Speed Mismatches

**Symptom**: Connection works but performance is terrible. The switch port shows incrementing **CRC errors**, **late collisions**, or **runts**.

When one end of a link is set to full duplex and the other to half duplex, the half-duplex side detects collisions while the full-duplex side does not. This creates a cascade of errors and retransmissions.

**Diagnosis**: Check interface status on both the switch and the connected device:
\`\`\`
Switch# show interface GigabitEthernet0/1 status
Port    Name    Status    Vlan    Duplex    Speed
Gi0/1           connected 10      a-full    a-1000
\`\`\`

If one side shows "full" and the other shows "half," you have a mismatch.

**Fix**: Set both sides to auto-negotiate, or manually configure both to the same speed and duplex. Do not set one side to auto and the other to a fixed value -- this is the most common cause of mismatches.

### VLAN Misconfiguration

**Symptom**: New device cannot communicate with other devices that are physically connected to the same switch.

**Steps**:
1. Check the switch port VLAN assignment: \`show vlan brief\`. Is the port in the correct VLAN?
2. Check trunk links: If VLANs span multiple switches, verify the trunk is carrying the needed VLAN: \`show interfaces trunk\`.
3. Verify inter-VLAN routing: If devices in different VLANs need to communicate, a Layer 3 device (router or L3 switch) must route between them.

A common mistake: an administrator moves a port to VLAN 99 for testing and forgets to move it back.

### Broadcast Storms and Switching Loops

**Symptom**: The entire network or VLAN becomes unresponsive. Switch CPU utilization spikes to 100%. Devices flood with traffic.

When redundant links exist between switches without Spanning Tree Protocol (STP), broadcast frames loop endlessly, multiplying with each pass. A single broadcast can consume all available bandwidth within seconds.

**Immediate fix**: Physically disconnect one of the redundant links to break the loop.

**Long-term fix**: Ensure STP is enabled and properly configured on all switches. Use Rapid STP (802.1w) for faster convergence. Enable **BPDU Guard** on access ports to prevent unauthorized switches from being connected. Enable **storm control** to limit broadcast traffic to a percentage of port bandwidth.

### Cable and Physical Layer Issues

**Symptoms**: No link light, intermittent connectivity, or errors on the interface.

**Steps**:
1. **Visual inspection**: Is the cable fully seated? Is it damaged?
2. **Try a known-good cable**: The simplest test.
3. **Check the patch panel**: Verify the patch panel port maps to the correct switch port.
4. **Cable tester**: A basic cable tester verifies continuity. A **cable certifier** tests the cable against category standards (Cat5e, Cat6, Cat6a) and can identify issues like **crosstalk**, **attenuation**, or **split pairs**.
5. **SFP/transceiver**: In fiber connections, check that the SFP module is properly seated and compatible with the switch and fiber type (single-mode vs. multi-mode).

**TDR (Time Domain Reflectometer)**: Many managed switches have built-in TDR testing. The switch sends a signal down the cable and measures the reflection to determine cable length and identify faults (opens, shorts) and their distance from the switch.`,
        },
        {
          id: 'network-fundamentals__m4__l4',
          title: 'Network Monitoring and Performance Baselining',
          objectives: [
            'Explain the importance of establishing network performance baselines',
            'Describe how SNMP and NetFlow provide visibility into network health and traffic patterns',
            'Set up alerts and dashboards to proactively detect network issues before users report them',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'A performance baseline captures normal network behavior metrics (bandwidth utilization, latency, error rates, CPU load) so that deviations from normal can be quickly identified as potential problems',
            'SNMP polls network devices for health metrics (interface status, CPU, memory, error counters) while NetFlow/sFlow captures traffic flow data showing who is talking to whom and how much bandwidth they are using',
            'Proactive monitoring with alerting thresholds (e.g., alert when link utilization exceeds 70%) catches problems before they impact users and enables capacity planning based on real data',
          ],
          content: `## Network Monitoring and Performance Baselining

The best network engineers fix problems before users notice them. This requires continuous monitoring, established baselines, and intelligent alerting. Reactive troubleshooting is necessary, but proactive monitoring is what separates good networks from great ones.

### Why Baselines Matter

A **baseline** is a snapshot of normal network behavior. Without one, you cannot answer the question: "Is this traffic level normal or abnormal?"

Suppose a switch uplink shows 800 Mbps utilization. Is this a problem? If the baseline shows normal utilization at 200 Mbps, yes -- something is consuming four times the usual bandwidth. If the baseline shows 750 Mbps during business hours, it is within expected range.

#### What to Baseline

Collect data on these metrics over at least two weeks (ideally a month) to capture daily and weekly patterns:

- **Bandwidth utilization** per link (percentage of capacity used)
- **Latency** between key points (office to data center, office to cloud services)
- **Packet loss** rates
- **Error counters** on interfaces (CRC errors, collisions, drops)
- **CPU and memory utilization** on routers, switches, and firewalls
- **DHCP pool utilization** (percentage of addresses leased)
- **Wi-Fi metrics** (client count, channel utilization, retry rates per AP)

#### Establishing the Baseline

1. Deploy monitoring tools and collect data.
2. Identify **normal ranges** for each metric during business hours, off-hours, and weekends.
3. Note **predictable peaks** (morning login storm, backup window, end-of-month processing).
4. Document the baseline with graphs and threshold values.
5. **Review and update** the baseline quarterly or after significant network changes.

### SNMP: Simple Network Management Protocol

**SNMP** is the standard protocol for monitoring network devices. Almost every managed switch, router, firewall, and access point supports it.

#### How SNMP Works

- **Manager**: The monitoring server (e.g., PRTG, Nagios, Zabbix, LibreNMS) that polls devices and receives alerts.
- **Agent**: Software running on the network device that responds to manager queries and can send unsolicited alerts.
- **MIB (Management Information Base)**: A structured database of all the metrics a device can report -- interface counters, CPU load, temperature, fan status, etc.
- **OID (Object Identifier)**: A unique identifier for each specific metric. For example, the OID for interface input octets is \`1.3.6.1.2.1.2.2.1.10\`.

#### SNMP Operations

- **GET**: The manager requests a specific value from the agent.
- **GET-NEXT**: Walk through the MIB sequentially.
- **SET**: The manager changes a value on the device (use with caution).
- **TRAP**: The agent proactively sends an alert to the manager when a threshold is crossed (link goes down, CPU exceeds 90%, etc.).

#### SNMP Versions

- **SNMPv1/v2c**: Use community strings (essentially passwords) sent in **clear text**. Still widely deployed but insecure.
- **SNMPv3**: Adds **authentication** (username/password with hashing) and **encryption** (AES/DES). Required for security-sensitive environments.

### NetFlow and sFlow: Traffic Analysis

While SNMP tells you **how much** traffic crosses an interface, **NetFlow** (Cisco) and **sFlow** (vendor-neutral) tell you **what kind** of traffic it is.

A NetFlow record includes:
- Source and destination IP addresses
- Source and destination port numbers
- Protocol (TCP, UDP, ICMP)
- Bytes and packets transferred
- Timestamps
- Input and output interfaces

This data answers critical questions:
- Which application is consuming the most bandwidth?
- Which users or departments generate the most traffic?
- Is there unusual traffic to unexpected destinations (potential security breach)?
- What would happen if we increased the video conferencing platform's usage?

**Flow collectors** like Ntopng, SolarWinds NetFlow Analyzer, or Elastiflow aggregate and visualize this data.

### Setting Up Effective Alerts

Raw data is useless without intelligent alerting. The goal is to be notified of **real problems** without drowning in false positives.

#### Alert Threshold Best Practices

- **Set thresholds based on baselines**, not arbitrary values. "Alert when utilization exceeds baseline + 30%" is better than "alert at 80%."
- **Use tiered severity levels**: Warning at 70% utilization, Critical at 90%.
- **Include duration**: "Alert when utilization exceeds 70% for more than 5 minutes." This eliminates momentary spikes.
- **Alert on rate of change**: A sudden jump from 20% to 60% in one minute is more concerning than a gradual climb from 60% to 70% over an hour.

#### Essential Alerts

At minimum, monitor and alert on:
- **Interface up/down** -- know immediately when a link fails.
- **High CPU/memory** on network devices -- prevents unexpected crashes.
- **Interface error counters increasing** -- indicates physical layer problems.
- **DHCP pool utilization above 80%** -- prevents address exhaustion.
- **WAN link utilization above 70%** -- triggers capacity planning discussions.
- **Reachability (ping) failures** to critical servers and services.

### Dashboards and Visualization

A well-designed dashboard gives you network health at a glance:

- **Top-level view**: Green/yellow/red status indicators for each site or critical link.
- **Drill-down capability**: Click a link to see historical bandwidth, errors, and latency.
- **Traffic flow view**: Top talkers, top applications, traffic by department.
- **Trending graphs**: Show how utilization has grown over weeks and months -- essential for **capacity planning**.

Popular monitoring platforms include Grafana (visualization) with Prometheus or InfluxDB (data storage), PRTG Network Monitor, Zabbix, LibreNMS, and SolarWinds. Many offer free tiers or community editions suitable for small networks.

### The Monitoring Mindset

Monitoring is not a project with an end date -- it is an ongoing practice. Schedule monthly reviews of your dashboards. Ask: Are there new trends? Are any links consistently above 70%? Have error rates increased? Is it time to add capacity?

The network professionals who maintain healthy, high-performing networks are the ones who watch the data continuously and act before the data becomes a user complaint.`,
        },
      ],
      quiz: [
        {
          id: 'network-fundamentals__m4__q1',
          question: 'What is the correct order of the CompTIA troubleshooting methodology?',
          options: [
            'Identify, Test, Plan, Implement, Document',
            'Identify, Establish theory, Test theory, Plan, Implement, Verify, Document',
            'Plan, Identify, Test, Implement, Document, Verify',
            'Test, Identify, Plan, Implement, Verify',
          ],
          correctIndex: 1,
          explanation:
            'The CompTIA seven-step methodology is: Identify the problem, Establish a theory of probable cause, Test the theory, Establish a plan of action, Implement the solution, Verify full system functionality, Document findings.',
        },
        {
          id: 'network-fundamentals__m4__q2',
          question: 'A device has an IP address of 169.254.x.x. What does this indicate?',
          options: [
            'The device is using a static IP',
            'The device is on a public network',
            'DHCP failed and the device assigned itself an APIPA address',
            'The DNS server is unreachable',
          ],
          correctIndex: 2,
          explanation:
            'A 169.254.x.x address is an APIPA (Automatic Private IP Addressing) address, automatically assigned when a device cannot reach a DHCP server. This indicates a DHCP failure.',
        },
        {
          id: 'network-fundamentals__m4__q3',
          question: 'If you can ping 8.8.8.8 but cannot browse to www.google.com, what is the most likely problem?',
          options: [
            'The default gateway is incorrect',
            'DNS resolution is failing',
            'The network cable is faulty',
            'The web server is down',
          ],
          correctIndex: 1,
          explanation:
            'Successfully pinging an IP address proves Layer 1-3 connectivity is working. Failure to reach a website by name while IP connectivity works indicates a DNS resolution problem.',
        },
        {
          id: 'network-fundamentals__m4__q4',
          question: 'Which SNMP version provides both authentication and encryption?',
          options: ['SNMPv1', 'SNMPv2c', 'SNMPv3', 'All versions support encryption'],
          correctIndex: 2,
          explanation:
            'SNMPv3 is the only version that provides authentication (username/password with hashing) and encryption (AES/DES). SNMPv1 and v2c use community strings sent in clear text.',
        },
        {
          id: 'network-fundamentals__m4__q5',
          question: 'What does NetFlow provide that SNMP interface monitoring does not?',
          options: [
            'Interface up/down status',
            'Device CPU utilization',
            'Detailed information about what types of traffic are flowing and between which hosts',
            'Device temperature readings',
          ],
          correctIndex: 2,
          explanation:
            'While SNMP tells you how much total traffic crosses an interface, NetFlow provides flow-level detail: source/destination IPs, ports, protocols, and byte counts, showing exactly what kind of traffic is using the bandwidth.',
        },
        {
          id: 'network-fundamentals__m4__q6',
          question: 'What is the primary purpose of establishing a network performance baseline?',
          options: [
            'To justify purchasing new equipment',
            'To define what normal behavior looks like so deviations can be identified as potential problems',
            'To comply with government regulations',
            'To measure individual employee productivity',
          ],
          correctIndex: 1,
          explanation:
            'A baseline captures normal network behavior so that abnormal conditions can be quickly identified. Without knowing what is normal, it is impossible to determine whether current metrics indicate a problem.',
        },
      ],
    },
  ],
};
