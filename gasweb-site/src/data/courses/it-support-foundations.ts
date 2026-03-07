import type { FullCourse } from '../courseContent';

export const itSupportFoundations: FullCourse = {
  id: 'it-support-foundations',
  instructorName: 'Lisa Thompson',
  instructorBio: 'IT support specialist and trainer with 14+ years in enterprise environments. CompTIA A+ certified instructor.',
  learningOutcomes: [
    'Identify and troubleshoot hardware and software issues',
    'Manage Windows, macOS, and Linux operating systems',
    'Understand networking basics for IT support roles',
    'Apply systematic troubleshooting methodologies',
  ],
  modules: [
    {
      id: 'it-support-foundations__m1',
      title: 'Hardware & Software',
      description: 'Learn the fundamentals of computer hardware components, software installation, and system configuration.',
      lessons: [
        {
          id: 'it-support-foundations__m1__l1',
          title: 'Computer Hardware Components',
          objectives: [
            'Identify the major components inside a computer',
            'Explain how CPU, RAM, and storage work together',
            'Determine hardware specifications for different use cases',
          ],
          estimatedMinutes: 25,
          keyTakeaways: [
            'The CPU processes instructions, RAM provides fast temporary storage, and drives provide persistent storage',
            'Understanding hardware specs helps in recommending upgrades and troubleshooting performance issues',
            'Form factors (desktop, laptop, server) use different component designs but share core concepts',
          ],
          content: `## Computer Hardware Components

Every computer, whether a desktop workstation, a laptop, or a rack-mounted server, is built from the same fundamental components. As an IT support professional, understanding these components is essential for diagnosing problems, recommending upgrades, and building systems that meet user needs.

### The Central Processing Unit (CPU)

The **CPU** is the brain of the computer. It executes instructions from software by performing arithmetic, logic, and control operations.

**Key CPU specifications:**
- **Clock speed** -- Measured in GHz, this indicates how many cycles per second the CPU can perform. A 3.5 GHz processor executes 3.5 billion cycles per second. Higher isn't always better -- architecture and efficiency matter too.
- **Cores** -- Modern CPUs have multiple cores, each capable of executing instructions independently. A quad-core processor can handle four threads simultaneously. Most desktop CPUs today have 4-16 cores.
- **Cache** -- Small, extremely fast memory built into the CPU. L1 cache (fastest, smallest), L2 cache, and L3 cache (largest, shared between cores) store frequently accessed data to reduce trips to main memory.
- **TDP (Thermal Design Power)** -- The maximum heat output in watts. Higher TDP requires better cooling solutions. Desktop CPUs typically range from 65W to 125W; laptop CPUs from 15W to 45W.

**Major CPU manufacturers:** Intel (Core i3/i5/i7/i9 series) and AMD (Ryzen 3/5/7/9 series). Both offer competitive options at various price points.

### Memory (RAM)

**RAM (Random Access Memory)** is volatile, high-speed memory that stores data the CPU is actively working with. When you open an application, its code and data are loaded from the storage drive into RAM for fast access.

**Key RAM specifications:**
- **Capacity** -- Measured in GB. 8 GB is minimum for general use, 16 GB for productivity, 32+ GB for content creation or virtualization.
- **Speed** -- Measured in MHz (e.g., DDR4-3200 runs at 3200 MHz). Faster RAM reduces wait times for the CPU.
- **Type** -- DDR4 is standard in most current systems; DDR5 is the newest generation with higher speeds and bandwidth.
- **Dual-channel** -- Installing matching pairs of RAM sticks enables dual-channel mode, effectively doubling memory bandwidth.

**Volatile vs. non-volatile:** RAM loses all data when power is removed. This is why you lose unsaved work when a computer crashes -- the data was in RAM but hadn't been written to the storage drive yet.

### Storage Drives

Storage drives hold the operating system, applications, and user data persistently (data survives power loss).

**Hard Disk Drives (HDDs):**
- Use spinning magnetic platters and a read/write head
- Affordable and available in large capacities (1-20+ TB)
- Slower than SSDs (typical read/write: 100-200 MB/s)
- Moving parts make them vulnerable to physical shock
- Best for bulk storage where speed isn't critical

**Solid State Drives (SSDs):**
- Use flash memory chips with no moving parts
- Significantly faster than HDDs (SATA SSD: 500 MB/s; NVMe SSD: 3,000-7,000+ MB/s)
- More expensive per GB than HDDs
- More durable (no moving parts to fail from drops or vibration)
- Recommended as the boot drive for all modern systems

**NVMe (Non-Volatile Memory Express)** is a protocol designed specifically for SSDs, connecting directly to the CPU via PCIe lanes. An NVMe SSD can be 5-10x faster than a SATA SSD. The M.2 form factor is a small card that plugs directly into the motherboard.

### The Motherboard

The **motherboard** is the main circuit board that connects all components together. It provides:
- **CPU socket** -- Where the processor is installed (LGA 1700 for Intel, AM5 for AMD, etc.)
- **RAM slots** -- Typically 2-4 DIMM slots for desktop, SO-DIMM for laptops
- **Expansion slots** -- PCIe slots for graphics cards, network adapters, and other add-in cards
- **Storage connectors** -- SATA ports for traditional drives, M.2 slots for NVMe SSDs
- **I/O ports** -- USB, audio, Ethernet, display outputs (on the rear I/O panel)
- **BIOS/UEFI chip** -- Firmware that initializes hardware during boot before the OS loads
- **Chipset** -- Manages data flow between the CPU, memory, storage, and peripherals

### Power Supply Unit (PSU)

The **PSU** converts AC wall power to DC power for computer components. Key specs:
- **Wattage** -- Must supply enough power for all components. A typical office PC needs 300-500W; gaming/workstation PCs need 650-850W.
- **Efficiency rating** -- 80 Plus certification (Bronze, Silver, Gold, Platinum, Titanium) indicates how efficiently power is converted.
- **Modular vs. non-modular** -- Modular PSUs let you connect only the cables you need, improving airflow and cable management.

### Peripherals and Connectors

Common ports and connectors you'll work with daily:
- **USB-A** -- The classic rectangular USB port (USB 2.0: 480 Mbps, USB 3.0: 5 Gbps)
- **USB-C** -- Reversible connector supporting USB 3.1/3.2, Thunderbolt, DisplayPort, and power delivery
- **HDMI/DisplayPort** -- Video output for monitors
- **Ethernet (RJ-45)** -- Wired network connection
- **3.5mm audio** -- Headphone and microphone jacks`,
        },
        {
          id: 'it-support-foundations__m1__l2',
          title: 'Software Installation and Management',
          objectives: [
            'Install and configure software applications properly',
            'Manage software updates and patches',
            'Understand software licensing models',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'Always download software from official sources to avoid malware',
            'Keeping software updated is critical for security and stability',
            'Understanding licensing prevents compliance violations',
          ],
          content: `## Software Installation and Management

Software installation and management is one of the most common tasks for IT support professionals. Doing it correctly ensures system stability, security, and compliance.

### Types of Software

**Operating System (OS)** -- The foundation software that manages hardware and provides services for applications. Windows, macOS, and Linux are the major desktop OSes.

**Applications** -- Programs that perform specific tasks for users: web browsers, office suites, email clients, development tools, etc.

**Drivers** -- Specialized software that allows the OS to communicate with hardware devices. Each hardware component (graphics card, printer, network adapter) needs a compatible driver.

**Firmware** -- Low-level software embedded in hardware devices (BIOS/UEFI, router firmware, printer firmware). Updates are less frequent but important for security and compatibility.

### Installation Best Practices

**Download from official sources only.** Downloading software from unofficial sites risks installing malware. Always use:
- The vendor's official website
- Trusted app stores (Microsoft Store, Apple App Store)
- Organization-approved software repositories
- Package managers (apt, yum, brew, chocolatey, winget)

**Verify downloads when possible.** Many vendors provide checksums (SHA-256 hashes) for their downloads. Compare the hash of your downloaded file against the published hash to verify integrity.

**Use standard (not custom) installation** unless you have a specific reason to change defaults. Custom installations let you choose components, install location, and optional features -- useful for advanced users or when disk space is limited.

**Run as administrator only when needed.** Software that modifies system files (drivers, system utilities) requires administrator privileges. Regular applications should install and run with standard user permissions.

### Software Updates and Patch Management

Keeping software updated is one of the most effective security measures:

- **Security patches** fix vulnerabilities that attackers can exploit. Many breaches occur because known vulnerabilities weren't patched.
- **Bug fixes** resolve issues that cause crashes, data loss, or incorrect behavior.
- **Feature updates** add new functionality.

**Windows Update** manages OS updates automatically. For enterprise environments, Windows Server Update Services (WSUS) or Microsoft Endpoint Configuration Manager (MECM/SCCM) provides centralized control.

**Third-party patch management** tools like PDQ Deploy, ManageEngine, or Ninite Pro handle updates for non-Microsoft software.

**Update strategy:**
1. Test updates in a non-production environment first
2. Deploy to a pilot group of users
3. Monitor for issues
4. Roll out to the broader organization
5. Have a rollback plan ready

### Software Licensing

Understanding licensing prevents legal issues and unexpected costs:

**Per-device licensing** -- The license is tied to a specific computer. Any user of that computer can use the software.

**Per-user licensing** -- The license is tied to a specific person. They can install on multiple devices (usually up to 5).

**Volume licensing** -- Discounted licenses for organizations purchasing in bulk. Managed through a volume license key (VLK) or license server.

**Subscription licensing** -- Pay monthly or annually for access (Microsoft 365, Adobe Creative Cloud). Software stops working if the subscription lapses.

**Open-source licensing** -- Software with source code freely available. Common licenses include GPL (must share modifications), MIT (permissive), and Apache 2.0 (permissive with patent protection).

**Software Asset Management (SAM)** tracks installed software, license compliance, and usage. This prevents:
- **Under-licensing** -- Using more copies than licensed (legal and financial risk)
- **Over-licensing** -- Paying for more licenses than needed (waste)
- **Shadow IT** -- Unauthorized software installations (security risk)`,
        },
        {
          id: 'it-support-foundations__m1__l3',
          title: 'BIOS/UEFI and Boot Process',
          objectives: [
            'Explain the POST and boot sequence',
            'Navigate BIOS/UEFI settings',
            'Configure boot order and secure boot',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'UEFI has replaced legacy BIOS with a modern interface and security features',
            'The boot process follows POST, bootloader, kernel load, and OS initialization',
            'Secure Boot prevents unauthorized bootloaders and rootkits from loading',
          ],
          content: `## BIOS/UEFI and Boot Process

Understanding the boot process helps you diagnose startup problems, configure hardware settings, and resolve issues that prevent the operating system from loading.

### BIOS vs. UEFI

**BIOS (Basic Input/Output System)** is the original firmware interface dating back to the 1980s. It initializes hardware during startup and hands off control to the operating system. BIOS uses a text-based interface and has significant limitations:
- Limited to booting from drives 2 TB or smaller (MBR partition scheme)
- Supports only 4 primary partitions
- 16-bit execution environment
- No built-in security features

**UEFI (Unified Extensible Firmware Interface)** is the modern replacement for BIOS. Most computers manufactured after 2012 use UEFI:
- Supports drives larger than 2 TB (GPT partition scheme)
- Supports up to 128 partitions
- 32-bit or 64-bit execution environment
- Graphical interface with mouse support
- **Secure Boot** -- Verifies that bootloaders are digitally signed
- Faster boot times
- Network capabilities for remote management

### The Boot Process

When you press the power button, the following sequence occurs:

**1. Power-On Self-Test (POST)**

The firmware (BIOS/UEFI) performs a series of diagnostic tests:
- Verify CPU functionality
- Check and count installed RAM
- Detect storage devices
- Initialize the graphics adapter
- Test keyboard and other input devices
- Check for expansion cards

If POST detects a critical error, it may produce **beep codes** (a pattern of beeps through the motherboard speaker) or **LED error codes** to indicate the failing component. Common beep patterns:
- 1 short beep: Normal POST, system OK
- Continuous beeping: RAM not detected or faulty
- 1 long + 2 short: Graphics card issue

**2. Boot Device Selection**

The firmware checks the configured boot order to find a bootable device. The boot order specifies the sequence of devices to try: first USB, then SSD, then network (PXE), etc. You can change this order in UEFI/BIOS settings.

**3. Bootloader Execution**

The firmware loads the bootloader from the boot device:
- **Windows**: Windows Boot Manager (bootmgfw.efi) loads from the EFI System Partition
- **Linux**: GRUB or systemd-boot loads from the EFI System Partition
- **macOS**: Apple's boot.efi loads from the EFI partition

**4. Kernel Loading**

The bootloader loads the OS kernel into memory:
- Windows loads ntoskrnl.exe
- Linux loads the vmlinuz kernel image
- The kernel initializes system services, loads drivers, and mounts file systems

**5. OS Initialization**

The kernel starts system services and presents the login screen.

### Common UEFI/BIOS Settings

**Boot Order** -- Set the priority of boot devices. For normal operation, the OS drive should be first. For OS installation, set the USB/DVD drive first.

**Secure Boot** -- When enabled, the firmware only loads bootloaders signed with trusted keys. This prevents rootkits and unauthorized operating systems from loading. Secure Boot must sometimes be disabled to install certain Linux distributions (though most major distros now support it).

**TPM (Trusted Platform Module)** -- A security chip that stores encryption keys, certificates, and hashing. Required for Windows 11 and BitLocker drive encryption. Enable it in UEFI settings (may be listed as "Intel PTT" or "AMD fTPM").

**Virtualization** -- Enable Intel VT-x or AMD-V to run virtual machines. Required for Hyper-V, VMware, VirtualBox, and WSL2.

**XMP/DOCP Profiles** -- Enable memory profiles to run RAM at its rated speed (rather than the default JEDEC speed, which is often slower).

### Troubleshooting Boot Issues

- **No POST** -- Check power connections, reseat RAM, try with one stick of RAM, clear CMOS
- **POST errors** -- Interpret beep codes or LED indicators, reseat/replace the failing component
- **Boot device not found** -- Check boot order, verify drive is connected and detected, check for damaged boot sector
- **OS won't load** -- Try Safe Mode, run startup repair, check for corrupted system files
- **Blue Screen during boot** -- Note the stop code, boot into Safe Mode, rollback recent driver or update changes`,
        },
        {
          id: 'it-support-foundations__m1__l4',
          title: 'Peripheral Devices and Drivers',
          objectives: [
            'Install and configure common peripherals',
            'Troubleshoot driver and connectivity issues',
            'Manage printer setup and print queues',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'Most peripherals are plug-and-play but may need specific drivers for full functionality',
            'Driver conflicts are a common source of hardware issues',
            'Network printers should be deployed via print server or Group Policy for enterprise environments',
          ],
          content: `## Peripheral Devices and Drivers

Peripherals are external devices connected to a computer: monitors, keyboards, mice, printers, scanners, webcams, external drives, and more. Managing these devices and their drivers is a core IT support skill.

### How Drivers Work

A **driver** is software that acts as a translator between the operating system and a hardware device. The OS sends standard commands to the driver, which converts them into device-specific instructions.

**Plug and Play (PnP):** Modern operating systems include built-in drivers for many common devices. When you connect a USB mouse or keyboard, the OS automatically detects it, loads the appropriate driver, and the device works immediately. This is called plug and play.

**Manufacturer drivers** provide additional features beyond basic functionality. For example, a gaming mouse might work with generic drivers for basic clicking, but the manufacturer's driver enables custom button mapping, DPI settings, and RGB lighting control.

### Installing Drivers

**Automatic (Windows Update):** Windows automatically downloads drivers for detected hardware through Windows Update. This works well for most devices.

**Manufacturer download:** For the latest features and best performance, download drivers directly from the manufacturer's website:
- GPU drivers: NVIDIA (GeForce Experience), AMD (Adrenalin Software)
- Peripherals: Manufacturer support pages
- Motherboard: Chipset and audio drivers from the board manufacturer

**Device Manager** (Windows) is the primary tool for managing drivers:
- View all installed hardware and their drivers
- Update drivers manually
- Roll back a problematic driver to a previous version
- Disable a malfunctioning device
- Check for driver errors (yellow triangle = warning, red X = disabled)

To open: Right-click Start > Device Manager, or run \`devmgmt.msc\`

### Common Driver Issues

**Device not recognized** -- The OS doesn't detect the device at all:
- Try a different USB port (preferably directly on the motherboard, not a hub)
- Try a different cable
- Test the device on another computer
- Check Device Manager for "Unknown device" entries
- Install the manufacturer's driver manually

**Driver conflicts** -- Two devices use the same system resources or incompatible drivers:
- Check Device Manager for error icons
- Update both drivers to the latest versions
- Uninstall one device, install its driver, then reconnect

**Blue Screen of Death (BSOD)** caused by drivers:
- Note the faulting driver name in the crash information
- Boot into Safe Mode (loads minimal drivers)
- Uninstall or rollback the problematic driver
- Common culprits: GPU drivers, antivirus drivers, USB drivers

### Printer Management

Printers are one of the most frequently supported peripherals in IT:

**Printer types:**
- **Inkjet** -- Uses liquid ink sprayed through microscopic nozzles. Good for color photos, higher cost per page.
- **Laser** -- Uses toner powder fused to paper with heat. Faster, lower cost per page, better for text documents.
- **Thermal** -- Uses heat on special paper. Common for receipts and labels.

**Connection types:**
- **USB** -- Direct connection to one computer. Simple but not shareable.
- **Network (Ethernet/Wi-Fi)** -- Printer has its own IP address. Multiple users can print. Configure via the printer's web interface.
- **Shared printer** -- A USB printer shared from one computer to others on the network. If the sharing computer is off, the printer is unavailable.

**Print queue management:**
- Access via Settings > Printers or \`control printers\`
- View pending jobs, cancel stuck jobs, restart the print spooler
- The **Print Spooler** service manages the queue. Restarting it often fixes stuck jobs:
  - Open Services (\`services.msc\`)
  - Find "Print Spooler" > Restart
  - Or via command line: \`net stop spooler && net start spooler\`

**Enterprise printer deployment:**
- Use a **print server** to centrally manage printers and drivers
- Deploy printers via **Group Policy** for automatic installation on domain computers
- Use **printer pools** to distribute jobs across multiple identical printers`,
        },
      ],
      quiz: [
        {
          id: 'it-support-foundations__m1__q1',
          question: 'Which component provides volatile, high-speed memory for data the CPU is actively processing?',
          options: ['SSD', 'RAM', 'Cache', 'Hard Drive'],
          correctIndex: 1,
          explanation: 'RAM (Random Access Memory) is volatile high-speed memory that stores data the CPU is actively working with. It loses all data when power is removed.',
        },
        {
          id: 'it-support-foundations__m1__q2',
          question: 'What is the primary advantage of an NVMe SSD over a SATA SSD?',
          options: [
            'NVMe SSDs are cheaper per GB',
            'NVMe SSDs connect via PCIe for significantly higher speeds',
            'NVMe SSDs have moving parts for better reliability',
            'NVMe SSDs use magnetic platters',
          ],
          correctIndex: 1,
          explanation: 'NVMe SSDs connect directly to the CPU via PCIe lanes, achieving speeds of 3,000-7,000+ MB/s compared to SATA SSDs which are limited to about 500 MB/s.',
        },
        {
          id: 'it-support-foundations__m1__q3',
          question: 'What does Secure Boot prevent?',
          options: [
            'Users from changing BIOS settings',
            'The computer from booting too quickly',
            'Unauthorized bootloaders and rootkits from loading',
            'Multiple operating systems from being installed',
          ],
          correctIndex: 2,
          explanation: 'Secure Boot verifies that bootloaders are digitally signed with trusted keys, preventing unauthorized or malicious bootloaders (including rootkits) from loading during startup.',
        },
        {
          id: 'it-support-foundations__m1__q4',
          question: 'A yellow triangle icon next to a device in Device Manager indicates:',
          options: [
            'The device is working correctly',
            'The device has a driver warning or problem',
            'The device is disabled',
            'The device needs a firmware update',
          ],
          correctIndex: 1,
          explanation: 'A yellow triangle (warning icon) in Device Manager indicates the device has a problem, typically a driver issue, resource conflict, or missing driver.',
        },
        {
          id: 'it-support-foundations__m1__q5',
          question: 'Which printer type is most cost-effective for high-volume text document printing?',
          options: ['Inkjet', 'Laser', 'Thermal', 'Dot matrix'],
          correctIndex: 1,
          explanation: 'Laser printers have a lower cost per page than inkjet printers and are faster for text documents, making them the most cost-effective choice for high-volume text printing.',
        },
        {
          id: 'it-support-foundations__m1__q6',
          question: 'What is the first step in the computer boot process?',
          options: [
            'Loading the operating system kernel',
            'Power-On Self-Test (POST)',
            'Executing the bootloader',
            'Mounting file systems',
          ],
          correctIndex: 1,
          explanation: 'POST (Power-On Self-Test) is the first step when a computer is powered on. The firmware tests critical hardware components before attempting to load a bootloader.',
        },
      ],
    },
    {
      id: 'it-support-foundations__m2',
      title: 'Operating Systems',
      description: 'Learn to manage Windows, macOS, and Linux operating systems including file systems, user accounts, and system tools.',
      lessons: [
        {
          id: 'it-support-foundations__m2__l1',
          title: 'Windows Administration Essentials',
          objectives: [
            'Navigate Windows system tools and control panels',
            'Manage user accounts and permissions',
            'Use Command Prompt and PowerShell for common tasks',
          ],
          estimatedMinutes: 25,
          keyTakeaways: [
            'Windows Settings and Control Panel provide GUI-based system management',
            'Command Prompt and PowerShell enable faster, scriptable administration',
            'User Account Control (UAC) protects against unauthorized system changes',
          ],
          content: `## Windows Administration Essentials

Windows is the most common operating system in enterprise environments, making Windows administration a critical skill for IT support professionals.

### Key System Tools

**Settings App** (Win + I) -- The modern interface for system configuration. Key sections:
- **System** -- Display, notifications, power, storage, multitasking
- **Network & Internet** -- Wi-Fi, Ethernet, VPN, proxy settings
- **Accounts** -- User accounts, sign-in options, sync settings
- **Apps** -- Installed applications, default apps, startup apps
- **Update & Security** -- Windows Update, Windows Security, backup, recovery

**Control Panel** -- The legacy configuration interface. Some settings are only available here:
- **Programs and Features** -- Uninstall programs, Windows features
- **Device Manager** -- Hardware and driver management
- **Network and Sharing Center** -- Advanced network configuration
- **Administrative Tools** -- Services, Computer Management, Event Viewer

**Task Manager** (Ctrl + Shift + Esc) -- Monitor and manage running processes:
- **Processes** tab -- See what's running and resource usage
- **Performance** tab -- CPU, memory, disk, and network utilization
- **Startup** tab -- Enable/disable startup programs
- **Services** tab -- View and manage Windows services

**Microsoft Management Console (MMC)** -- Framework for administrative snap-ins. Common snap-ins:
- \`compmgmt.msc\` -- Computer Management (combines several tools)
- \`diskmgmt.msc\` -- Disk Management (partition, format drives)
- \`services.msc\` -- Services (start, stop, configure services)
- \`eventvwr.msc\` -- Event Viewer (system and application logs)
- \`lusrmgr.msc\` -- Local Users and Groups (account management)

### User Account Management

**Account Types:**
- **Administrator** -- Full system access, can install software, change settings, manage other accounts
- **Standard User** -- Can use applications and change personal settings but cannot modify system settings or install software for all users

**User Account Control (UAC)** prompts for confirmation or credentials when an action requires administrator privileges. This prevents malware from silently making system changes. Best practice: use a standard account for daily work and elevate only when needed.

**Local vs. Domain Accounts:**
- **Local accounts** exist only on one computer
- **Microsoft accounts** sync settings across devices via the cloud
- **Domain accounts** (Active Directory) are managed centrally and can log into any domain-joined computer

### Command Line Tools

**Command Prompt (cmd.exe)** -- Essential commands every IT support person should know:

- \`ipconfig\` -- Display network configuration (\`/all\` for detailed info, \`/release\` and \`/renew\` for DHCP)
- \`ping <host>\` -- Test network connectivity to a host
- \`sfc /scannow\` -- System File Checker, repairs corrupted system files
- \`chkdsk\` -- Check disk for file system errors
- \`netstat -an\` -- Show active network connections and listening ports
- \`tasklist\` / \`taskkill\` -- List and terminate processes
- \`systeminfo\` -- Display detailed system information
- \`shutdown /r /t 0\` -- Restart immediately

**PowerShell** -- A more powerful command-line shell with scripting capabilities:
- \`Get-Process\` -- List running processes
- \`Get-Service\` -- List services and their status
- \`Get-EventLog -LogName System -Newest 20\` -- View recent system events
- \`Test-NetConnection <host> -Port 443\` -- Test network connectivity on a specific port
- \`Get-ComputerInfo\` -- Detailed system information

### File System (NTFS)

**NTFS (New Technology File System)** is the standard file system for Windows:
- **Permissions** -- Granular access control (Read, Write, Modify, Full Control) on files and folders
- **Encryption** -- EFS (Encrypting File System) encrypts individual files and folders
- **Compression** -- Built-in file compression to save disk space
- **Quotas** -- Limit disk space usage per user
- **Journaling** -- Tracks changes to help recover from crashes without data corruption

**File path limits:** Traditional Windows paths are limited to 260 characters. Long path support can be enabled via Group Policy for paths up to 32,767 characters.`,
        },
        {
          id: 'it-support-foundations__m2__l2',
          title: 'macOS and Linux Basics',
          objectives: [
            'Navigate macOS system preferences and built-in utilities',
            'Use Linux terminal commands for basic system administration',
            'Compare file systems across Windows, macOS, and Linux',
          ],
          estimatedMinutes: 25,
          keyTakeaways: [
            'macOS and Linux share Unix roots, making many commands transferable',
            'Linux uses package managers (apt, yum, dnf) for software installation',
            'Understanding multiple OSes is essential for modern IT support roles',
          ],
          content: `## macOS and Linux Basics

While Windows dominates enterprise desktops, IT support professionals increasingly need to support macOS (common in creative and development teams) and Linux (servers, development environments, and some desktops).

### macOS Essentials

macOS is Apple's desktop operating system, built on a Unix foundation (Darwin). Key concepts:

**System Preferences / System Settings** (Apple menu > System Settings):
- **General** -- Appearance, default browser, AirDrop, login items
- **Network** -- Wi-Fi, Ethernet, VPN, DNS configuration
- **Security & Privacy** -- FileVault encryption, firewall, privacy permissions
- **Users & Groups** -- Account management, login options
- **Software Update** -- macOS and security updates

**Finder** is the macOS file manager (equivalent to Windows Explorer):
- **Applications** folder -- Where apps are installed
- **Library** folder -- Application support files, preferences (hidden by default)
- **Home folder** -- User's documents, desktop, downloads

**Disk Utility** manages storage devices:
- Format drives, create partitions
- Repair disk permissions
- Create and manage disk images
- First Aid: diagnose and repair file system issues

**Activity Monitor** (equivalent to Task Manager):
- View CPU, memory, energy, disk, and network usage
- Force quit unresponsive applications
- Identify resource-heavy processes

**Terminal** provides command-line access. Since macOS is Unix-based, most Linux commands work:
- \`ls\`, \`cd\`, \`cp\`, \`mv\`, \`rm\` -- File operations
- \`top\` / \`htop\` -- Process monitoring
- \`ifconfig\` / \`networksetup\` -- Network configuration
- \`defaults\` -- Manage system preferences from command line
- \`brew\` (Homebrew) -- Package manager for installing command-line tools

**macOS File System:** APFS (Apple File System) is the default. It supports:
- Native encryption (FileVault)
- Snapshots for Time Machine backups
- Space sharing between partitions
- Crash protection

### Linux Essentials

Linux is an open-source operating system kernel used in servers, cloud infrastructure, IoT devices, and desktops. Key distributions include:
- **Ubuntu** -- Most popular for desktops and beginners
- **Red Hat Enterprise Linux (RHEL) / CentOS Stream** -- Enterprise server standard
- **Debian** -- Stable, community-driven, Ubuntu's upstream
- **Fedora** -- Cutting-edge features, sponsored by Red Hat

**The Linux Terminal** is the primary administration tool. Essential commands:

**File operations:**
- \`ls -la\` -- List files with details and hidden files
- \`cd /path/to/dir\` -- Change directory
- \`cp source dest\` -- Copy files (\`-r\` for directories)
- \`mv source dest\` -- Move or rename files
- \`rm file\` -- Delete a file (\`-rf\` for directories -- use with extreme caution)
- \`chmod 755 file\` -- Change file permissions
- \`chown user:group file\` -- Change file ownership
- \`find / -name "filename"\` -- Search for files

**System management:**
- \`sudo command\` -- Run a command with root (administrator) privileges
- \`systemctl start|stop|status service\` -- Manage services
- \`df -h\` -- Show disk space usage
- \`free -h\` -- Show memory usage
- \`uname -a\` -- Show system information
- \`cat /etc/os-release\` -- Show distribution information

**Package management:**
- Ubuntu/Debian: \`sudo apt update && sudo apt upgrade\` (update packages), \`sudo apt install package-name\`
- RHEL/Fedora: \`sudo dnf update\`, \`sudo dnf install package-name\`

**Linux File System Structure:**
- \`/\` -- Root of the file system
- \`/home\` -- User home directories
- \`/etc\` -- System configuration files
- \`/var\` -- Variable data (logs, databases, mail)
- \`/tmp\` -- Temporary files
- \`/usr\` -- User programs and libraries
- \`/bin\`, \`/sbin\` -- Essential command binaries

**Linux Permissions** use a three-tier model:
- **Owner** -- The file's creator
- **Group** -- Users in the file's group
- **Others** -- Everyone else

Permissions are Read (r=4), Write (w=2), Execute (x=1). Example: \`chmod 755\` means owner has full access (7=4+2+1), group and others can read and execute (5=4+1).`,
        },
      ],
      quiz: [
        {
          id: 'it-support-foundations__m2__q1',
          question: 'Which Windows command repairs corrupted system files?',
          options: ['chkdsk', 'sfc /scannow', 'defrag', 'diskpart'],
          correctIndex: 1,
          explanation: 'The System File Checker (sfc /scannow) scans and repairs corrupted Windows system files by replacing them with cached copies.',
        },
        {
          id: 'it-support-foundations__m2__q2',
          question: 'What is the purpose of User Account Control (UAC) in Windows?',
          options: [
            'To manage user passwords',
            'To prompt for confirmation before system-level changes',
            'To encrypt user files',
            'To limit internet access',
          ],
          correctIndex: 1,
          explanation: 'UAC prompts users for confirmation or administrator credentials before allowing actions that could affect system settings or security, preventing unauthorized changes.',
        },
        {
          id: 'it-support-foundations__m2__q3',
          question: 'Which Linux command changes file permissions?',
          options: ['chown', 'chmod', 'chgrp', 'usermod'],
          correctIndex: 1,
          explanation: 'chmod (change mode) modifies file and directory permissions in Linux, controlling read, write, and execute access for owner, group, and others.',
        },
        {
          id: 'it-support-foundations__m2__q4',
          question: 'In Linux, the permission value 755 means:',
          options: [
            'Everyone has full access',
            'Owner has full access; group and others can read and execute',
            'Only the owner can access the file',
            'The file is encrypted with 7-5-5 bit encryption',
          ],
          correctIndex: 1,
          explanation: '755 means the owner has read+write+execute (7=4+2+1), while group and others have read+execute (5=4+1).',
        },
        {
          id: 'it-support-foundations__m2__q5',
          question: 'What is APFS?',
          options: [
            'A Windows file system',
            'A Linux package manager',
            'Apple\'s modern file system with encryption and snapshot support',
            'An Android file sharing protocol',
          ],
          correctIndex: 2,
          explanation: 'APFS (Apple File System) is macOS\'s default file system, supporting native encryption (FileVault), snapshots for Time Machine, space sharing, and crash protection.',
        },
      ],
    },
    {
      id: 'it-support-foundations__m3',
      title: 'Networking Basics',
      description: 'Learn essential networking concepts for IT support including IP addressing, DNS, DHCP, and basic network troubleshooting.',
      lessons: [
        {
          id: 'it-support-foundations__m3__l1',
          title: 'IP Addressing and Network Configuration',
          objectives: [
            'Explain IPv4 addressing, subnet masks, and CIDR notation',
            'Configure static and dynamic IP addresses',
            'Distinguish between public and private IP addresses',
          ],
          estimatedMinutes: 25,
          keyTakeaways: [
            'IP addresses identify devices on a network; subnet masks define network boundaries',
            'DHCP automatically assigns IP addresses; static IPs are used for servers and network devices',
            'Private IP ranges (10.x, 172.16-31.x, 192.168.x) are used internally and translated to public IPs via NAT',
          ],
          content: `## IP Addressing and Network Configuration

Understanding IP addressing is fundamental to every IT support role. Whether you're configuring a new workstation, troubleshooting connectivity, or setting up a printer on the network, you need to understand how devices find and communicate with each other.

### IPv4 Addresses

An **IPv4 address** is a 32-bit number that uniquely identifies a device on a network. It's written as four decimal numbers separated by dots (dotted decimal notation), each ranging from 0 to 255:

Example: **192.168.1.100**

Each number represents 8 bits (an octet), so the full address is 4 octets = 32 bits.

### Subnet Masks

A **subnet mask** determines which portion of an IP address identifies the network and which portion identifies the specific device (host):

- **255.255.255.0** (/24) -- The first three octets are the network; the last octet is the host. This allows 254 usable host addresses (0 is the network address, 255 is the broadcast address).
- **255.255.0.0** (/16) -- The first two octets are the network, allowing 65,534 hosts.
- **255.0.0.0** (/8) -- Only the first octet is the network, allowing over 16 million hosts.

**CIDR notation** appends the number of network bits after a slash: 192.168.1.0/24 means the first 24 bits are the network portion.

### Private vs. Public IP Addresses

**Private IP ranges** are reserved for internal networks and are NOT routable on the public Internet:
- **10.0.0.0 -- 10.255.255.255** (10.0.0.0/8) -- Large organizations
- **172.16.0.0 -- 172.31.255.255** (172.16.0.0/12) -- Medium networks
- **192.168.0.0 -- 192.168.255.255** (192.168.0.0/16) -- Home and small office networks

**Public IP addresses** are globally unique and routable on the Internet. Your ISP assigns public IP addresses to your router.

**NAT (Network Address Translation)** allows multiple devices with private IPs to share one public IP address. Your home router performs NAT -- all devices on your home network appear to use the same public IP when accessing the Internet.

### DHCP -- Dynamic Host Configuration Protocol

**DHCP** automatically assigns IP addresses and network configuration to devices:

The DHCP process (DORA):
1. **Discover** -- The client broadcasts "I need an IP address"
2. **Offer** -- The DHCP server responds with an available IP and configuration
3. **Request** -- The client requests the offered IP
4. **Acknowledge** -- The server confirms the assignment

DHCP provides: IP address, subnet mask, default gateway, DNS server addresses, and lease duration.

**DHCP lease** -- IP addresses are assigned for a limited time. When the lease expires, the client must renew it. Default lease times vary but are often 8-24 hours.

**DHCP reservations** assign a specific IP to a device based on its MAC address. The device still uses DHCP but always gets the same IP. Useful for printers and network devices that need consistent addresses.

### Static IP Configuration

Some devices should have **static (manually configured) IP addresses**:
- Servers
- Network printers
- Routers and switches
- DNS servers
- DHCP servers (the DHCP server itself cannot use DHCP!)

**Windows static IP:** Settings > Network > Ethernet/Wi-Fi > Edit IP assignment > Manual

**Required information:**
- IP address (must be outside the DHCP range)
- Subnet mask
- Default gateway (usually the router's IP)
- DNS servers (e.g., 8.8.8.8 for Google DNS, or your internal DNS server)

### IPv6

**IPv6** uses 128-bit addresses to solve IPv4 address exhaustion. An IPv6 address looks like: \`2001:0db8:85a3:0000:0000:8a2e:0370:7334\`

Leading zeros in groups can be omitted, and consecutive groups of zeros can be replaced with \`::\` once: \`2001:db8:85a3::8a2e:370:7334\`

IPv6 is increasingly important as IPv4 addresses run out, but most internal networks still primarily use IPv4.`,
        },
        {
          id: 'it-support-foundations__m3__l2',
          title: 'DNS, DHCP, and Core Network Services',
          objectives: [
            'Explain how DNS resolves domain names to IP addresses',
            'Describe common DNS record types',
            'Troubleshoot DNS-related connectivity issues',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'DNS translates human-readable domain names to IP addresses',
            'Common record types include A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail), and TXT',
            'DNS issues are among the most common causes of "Internet is down" complaints',
          ],
          content: `## DNS, DHCP, and Core Network Services

### DNS -- Domain Name System

**DNS** is often called the "phone book of the Internet." It translates human-readable domain names (like google.com) into IP addresses (like 142.250.80.46) that computers use to communicate.

### How DNS Resolution Works

When you type "www.example.com" in your browser:

1. **Browser cache** -- The browser checks if it recently resolved this domain
2. **OS cache** -- The operating system checks its DNS cache
3. **Hosts file** -- The OS checks the local hosts file (\`C:\\Windows\\System32\\drivers\\etc\\hosts\` on Windows, \`/etc/hosts\` on Linux/Mac)
4. **Recursive resolver** -- The query goes to your configured DNS server (usually your ISP or a public DNS like 8.8.8.8)
5. **Root servers** -- If the resolver doesn't have the answer cached, it asks a root DNS server "Who handles .com?"
6. **TLD servers** -- The root server points to the .com TLD (Top-Level Domain) server, which knows about example.com
7. **Authoritative server** -- The TLD server points to example.com's authoritative DNS server, which provides the actual IP address
8. **Response** -- The IP address is returned to your computer, cached at each level for future queries

This entire process typically takes milliseconds.

### DNS Record Types

- **A Record** -- Maps a domain name to an IPv4 address (example.com → 93.184.216.34)
- **AAAA Record** -- Maps a domain name to an IPv6 address
- **CNAME Record** -- Creates an alias pointing to another domain (www.example.com → example.com)
- **MX Record** -- Specifies mail servers for the domain (where to deliver email)
- **TXT Record** -- Stores text information, commonly used for SPF (email authentication), DKIM, and domain verification
- **NS Record** -- Identifies the authoritative name servers for a domain
- **PTR Record** -- Reverse DNS, maps an IP address back to a domain name
- **SOA Record** -- Contains administrative information about the DNS zone

### DNS Troubleshooting

**nslookup** -- Query DNS servers:
- \`nslookup example.com\` -- Resolve a domain using default DNS
- \`nslookup example.com 8.8.8.8\` -- Resolve using Google's DNS
- If internal DNS fails but external works, the issue is with your DNS server

**Common DNS issues:**
- "DNS server not responding" -- Check DNS server IP in network config, try alternative DNS (8.8.8.8)
- "Site not found" but IP works -- DNS issue, not a network issue. Flush DNS cache: \`ipconfig /flushdns\` (Windows) or \`sudo dscacheutil -flushcache\` (macOS)
- Slow resolution -- DNS server may be overloaded, try a faster public DNS
- Wrong site loading -- Check hosts file for rogue entries (malware sometimes modifies the hosts file)

### The Default Gateway

The **default gateway** is the router's IP address on your network. It's the "door" that traffic passes through to reach other networks, including the Internet.

If you can ping devices on your local network but cannot reach the Internet, the default gateway might be misconfigured, or the router might have an issue.

**Checking the gateway:** \`ipconfig\` (Windows) or \`ip route\` (Linux) shows the default gateway.`,
        },
      ],
      quiz: [
        {
          id: 'it-support-foundations__m3__q1',
          question: 'Which private IP range is most commonly used in home networks?',
          options: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '169.254.0.0/16'],
          correctIndex: 2,
          explanation: 'The 192.168.x.x range is most commonly used in home and small office networks. Most consumer routers default to 192.168.0.1 or 192.168.1.1.',
        },
        {
          id: 'it-support-foundations__m3__q2',
          question: 'What does DHCP DORA stand for?',
          options: [
            'Detect, Organize, Route, Acknowledge',
            'Discover, Offer, Request, Acknowledge',
            'Download, Open, Read, Apply',
            'Distribute, Organize, Resolve, Assign',
          ],
          correctIndex: 1,
          explanation: 'DORA stands for Discover, Offer, Request, Acknowledge -- the four-step process by which a DHCP client obtains an IP address from a DHCP server.',
        },
        {
          id: 'it-support-foundations__m3__q3',
          question: 'Which DNS record type maps a domain to an IPv4 address?',
          options: ['MX', 'CNAME', 'A', 'TXT'],
          correctIndex: 2,
          explanation: 'An A (Address) record maps a domain name to an IPv4 address. AAAA records do the same for IPv6 addresses.',
        },
        {
          id: 'it-support-foundations__m3__q4',
          question: 'A user can ping 8.8.8.8 but cannot access google.com. The most likely issue is:',
          options: [
            'The network cable is unplugged',
            'The firewall is blocking all traffic',
            'DNS resolution is failing',
            'The default gateway is incorrect',
          ],
          correctIndex: 2,
          explanation: 'If pinging an IP works but domain names don\'t resolve, DNS is the issue. The network connection and routing work fine (proven by the successful ping), but the DNS server cannot translate domain names to IPs.',
        },
        {
          id: 'it-support-foundations__m3__q5',
          question: 'What is NAT used for?',
          options: [
            'Encrypting network traffic',
            'Translating private IPs to a public IP for Internet access',
            'Assigning IP addresses automatically',
            'Resolving domain names to IPs',
          ],
          correctIndex: 1,
          explanation: 'NAT (Network Address Translation) allows multiple devices with private IP addresses to share one public IP address when accessing the Internet.',
        },
      ],
    },
    {
      id: 'it-support-foundations__m4',
      title: 'Troubleshooting Methodology',
      description: 'Learn systematic approaches to diagnosing and resolving technical issues efficiently.',
      lessons: [
        {
          id: 'it-support-foundations__m4__l1',
          title: 'The CompTIA Troubleshooting Model',
          objectives: [
            'Apply the six-step troubleshooting methodology',
            'Ask effective diagnostic questions',
            'Document solutions for future reference',
          ],
          estimatedMinutes: 25,
          keyTakeaways: [
            'Systematic troubleshooting saves time compared to random trial-and-error',
            'Always identify the problem fully before attempting solutions',
            'Documentation turns one-time fixes into reusable knowledge',
          ],
          content: `## The CompTIA Troubleshooting Model

Effective troubleshooting is the most valuable skill in IT support. While technical knowledge helps you understand potential causes, a systematic methodology ensures you solve problems efficiently and consistently.

### The Six-Step Troubleshooting Model

CompTIA's troubleshooting methodology (used in the A+ certification) provides a structured approach:

### Step 1: Identify the Problem

Before you can fix something, you need to understand exactly what's broken:

**Gather information from the user:**
- "What exactly happens when the problem occurs?"
- "When did this start? Did anything change before it began?"
- "Does it happen every time or intermittently?"
- "Are other users or devices affected?"
- "Have you tried anything to fix it?"

**Reproduce the issue** whenever possible. If you can see the problem yourself, you can observe error messages, system behavior, and environmental factors the user might not mention.

**Check for recent changes:**
- Software updates or installations
- Hardware changes
- Network configuration changes
- New users or permissions changes
- Environmental changes (moved desk, new equipment nearby)

**Review documentation and logs:**
- Event Viewer (Windows), Console (macOS), journalctl (Linux)
- Application logs
- Previous support tickets for similar issues

### Step 2: Establish a Theory of Probable Cause

Based on your information gathering, form a hypothesis about what's causing the problem. Start with the most common and simplest explanations:

**Consider the obvious first:**
- Is it plugged in? Is it turned on?
- Is the cable connected properly?
- Has the user restarted the device?
- Is the problem user-specific or system-wide?

**Use the OSI model or layered approach** to organize your thinking:
1. Physical -- Cables, connections, power
2. Network -- IP config, DNS, DHCP, connectivity
3. Software -- Drivers, updates, configuration
4. Application -- App-specific settings, permissions
5. User -- Training, workflow, expectations

### Step 3: Test the Theory to Determine Cause

Verify your hypothesis with a targeted test:

- If you suspect a DNS issue, try pinging an IP address directly
- If you suspect a cable, swap it with a known-good cable
- If you suspect a driver, try rolling back or updating it
- If you suspect a permission issue, test with an admin account

**If the theory is confirmed**, proceed to Step 4.
**If the theory is NOT confirmed**, return to Step 2 and form a new hypothesis. Don't keep trying the same fix -- re-evaluate your information.

### Step 4: Establish a Plan of Action and Implement the Solution

Once you know the cause, plan your fix:

- Consider the impact on the user and other systems
- Determine if a maintenance window is needed
- Have a rollback plan in case the fix creates new problems
- Communicate with the user about what you're doing and expected downtime

Implement the solution methodically. Make one change at a time so you can identify what actually fixed the problem.

### Step 5: Verify Full System Functionality

After implementing the fix:

- Confirm the original problem is resolved
- Test related functionality (fixing one thing shouldn't break another)
- Ask the user to verify the fix works for their specific workflow
- Check that any preventive measures are in place to avoid recurrence

### Step 6: Document Findings, Actions, and Outcomes

Documentation is often skipped but is incredibly valuable:

- **Update the ticket** with problem description, cause, and resolution
- **Add to the knowledge base** if this is a new or recurring issue
- **Note any workarounds** if the root cause couldn't be fully addressed
- **Record time spent** for capacity planning and SLA tracking

Good documentation helps:
- Other technicians solve the same problem faster
- Identify patterns and recurring issues
- Justify budget for systemic fixes
- Satisfy audit and compliance requirements

### Common Troubleshooting Tools

- **ping** -- Test basic network connectivity
- **tracert/traceroute** -- Trace the network path to a destination
- **ipconfig/ifconfig** -- View network configuration
- **nslookup/dig** -- Test DNS resolution
- **Task Manager/top** -- Check resource utilization
- **Event Viewer/logs** -- Review system and application events
- **Safe Mode** -- Boot with minimal drivers to isolate software issues
- **System Restore** -- Roll back to a previous working state`,
        },
        {
          id: 'it-support-foundations__m4__l2',
          title: 'Customer Service and Communication',
          objectives: [
            'Communicate technical concepts to non-technical users',
            'Handle difficult support situations professionally',
            'Write effective ticket documentation',
          ],
          estimatedMinutes: 20,
          keyTakeaways: [
            'Technical skill without communication skill limits your effectiveness',
            'Use analogies and plain language, not jargon, with non-technical users',
            'Good ticket documentation reduces repeat work and escalations',
          ],
          content: `## Customer Service and Communication

Technical skills get you into IT support, but communication skills determine your success. The best troubleshooter in the world is ineffective if they can't understand what users need or explain solutions clearly.

### Communicating with Non-Technical Users

**Avoid jargon.** Instead of "Your DNS resolver isn't responding," say "Your computer is having trouble finding websites on the Internet. I'm going to fix the setting that translates website names into addresses."

**Use analogies.** Compare technical concepts to familiar things:
- DNS is like "a phone book for the Internet"
- RAM is like "your desk space -- the more you have, the more you can work on at once"
- A firewall is like "a security guard that checks who's allowed in and out"
- Bandwidth is like "a highway -- more lanes means more traffic can flow"

**Set expectations.** Tell the user:
- What you're going to do
- How long it might take
- Whether they'll experience any disruption
- When they can expect the issue to be fully resolved

**Listen actively.** Users often provide critical diagnostic information wrapped in non-technical descriptions:
- "The screen went blue with a sad face" = BSOD
- "The Internet is slow" could mean DNS issues, bandwidth, or a specific website is down
- "My computer is frozen" might mean one application is unresponsive, not the entire system

**Never blame the user.** Even if the user caused the problem (clicked a phishing link, unplugged the wrong cable), focus on the solution rather than the cause. "Let me get this fixed for you" is better than "Well, you shouldn't have clicked that."

### Handling Difficult Situations

**Frustrated users** -- Acknowledge their frustration: "I understand this is impacting your work, and I want to get it resolved as quickly as possible." Don't take it personally.

**VIP/Executive users** -- Maintain professionalism, communicate proactively with status updates, and understand that their time constraints may require different approaches (temporary workarounds while you investigate root causes).

**Repeat issues** -- If a user reports the same problem again, don't make them re-explain everything. Review previous tickets and say "I see you've had this issue before. Let me look at what was done previously and see if we need a different approach."

### Effective Ticket Documentation

A well-written ticket saves time for everyone:

**Problem description:**
- User's name and contact info
- Date, time, and method of report
- Specific symptoms in clear language
- Steps to reproduce (if known)
- Impact and urgency

**Troubleshooting steps:**
- What you tested and the results
- Changes you made (with before/after details)
- What worked and what didn't

**Resolution:**
- Root cause (if identified)
- Solution applied
- Verification that the fix works
- Preventive recommendations

**Example of poor documentation:**
"Fixed the printer."

**Example of good documentation:**
"User reported HP LaserJet 4050 in Room 205 printing blank pages. Checked toner -- level OK. Printed test page from printer menu -- came out fine. Issue was with user's laptop driver. Uninstalled and reinstalled printer driver v3.5 from HP support site. Test print from Word successful. Recommended user restart laptop if issue recurs."

### Ticketing System Best Practices

- **Categorize accurately** -- Helps with reporting and routing
- **Set priority appropriately** -- Not every issue is critical
- **Update regularly** -- Users appreciate knowing their issue is being worked on
- **Link related tickets** -- Identify patterns and systemic issues
- **Close with confirmation** -- Verify with the user before closing the ticket`,
        },
      ],
      quiz: [
        {
          id: 'it-support-foundations__m4__q1',
          question: 'What is the FIRST step in the CompTIA troubleshooting methodology?',
          options: [
            'Establish a theory of probable cause',
            'Test the theory',
            'Identify the problem',
            'Implement the solution',
          ],
          correctIndex: 2,
          explanation: 'The first step is always to identify the problem by gathering information from the user, reproducing the issue, and reviewing logs -- before forming any theories.',
        },
        {
          id: 'it-support-foundations__m4__q2',
          question: 'When troubleshooting, what should you do if your theory is NOT confirmed by testing?',
          options: [
            'Try the same fix again with different settings',
            'Escalate immediately to the next support tier',
            'Return to Step 2 and form a new hypothesis',
            'Ask the user to restart their computer',
          ],
          correctIndex: 2,
          explanation: 'If testing doesn\'t confirm your theory, go back to Step 2 and form a new hypothesis based on the additional information you gathered during testing.',
        },
        {
          id: 'it-support-foundations__m4__q3',
          question: 'Why is documentation important after resolving a support issue?',
          options: [
            'It\'s only needed for compliance audits',
            'It helps other technicians solve similar problems and identifies patterns',
            'It\'s only useful for billing purposes',
            'It\'s only required for critical issues',
          ],
          correctIndex: 1,
          explanation: 'Documentation creates a knowledge base that helps other technicians resolve similar issues faster, identifies recurring problems, and provides an audit trail.',
        },
        {
          id: 'it-support-foundations__m4__q4',
          question: 'A user says "the Internet is down." What should you do FIRST?',
          options: [
            'Restart the router',
            'Ask clarifying questions to understand the actual symptoms',
            'Run a speed test',
            'Replace the Ethernet cable',
          ],
          correctIndex: 1,
          explanation: 'The first step is always to identify the problem. "The Internet is down" could mean many things -- ask what specifically is happening, what they were trying to do, and whether it affects all sites or just one.',
        },
        {
          id: 'it-support-foundations__m4__q5',
          question: 'When implementing a fix, why should you make only one change at a time?',
          options: [
            'To save time',
            'To identify which specific change resolved the issue',
            'Because multiple changes are not allowed',
            'To avoid needing documentation',
          ],
          correctIndex: 1,
          explanation: 'Making one change at a time lets you identify exactly what fixed the problem. If you make multiple changes simultaneously and the problem is resolved, you won\'t know which change was the actual fix.',
        },
      ],
    },
  ],
};
