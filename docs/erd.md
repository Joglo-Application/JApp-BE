erDiagram

    User {
        int user_id PK
        string nama_user
        string username UK
        string password
        enum role "admin|kasir|owner"
        datetime created_at
        datetime updated_at
    }

    Bahan_Baku {
        int bahan_id PK
        string nama_bahan
        string satuan
        decimal stok
        decimal stok_minimum
        int harga_satuan
        datetime created_at
        datetime updated_at
    }

    Supplier {
        int supplier_id PK
        string nama_supplier
        string no_telp
        string alamat
        string email
        datetime created_at
        datetime updated_at
    }

    Menu {
        int menu_id PK
        string nama_menu
        string kategori
        int harga
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    Resep_Menu {
        int resep_id PK
        int menu_id FK
        int bahan_id FK
        decimal jumlah_pakai
        datetime created_at
        datetime updated_at
    }

    Pesanan {
        int pesanan_id PK
        date tanggal
        enum status "pending|completed|cancelled"
        int total
        int user_id FK
        datetime created_at
        datetime updated_at
    }

    Detail_Pesanan {
        int detail_id PK
        int jumlah
        int harga_satuan
        int subtotal
        int pesanan_id FK
        int menu_id FK
    }

    Pesanan_Bahan {
        int pesanan_bahan_id PK
        date tanggal
        decimal jumlah
        enum status "pending|received|cancelled"
        int bahan_id FK
        int supplier_id FK
        int user_id FK
        datetime created_at
        datetime updated_at
    }

    Transaksi_Bahan_Masuk {
        int transaksi_masuk_id PK
        date tanggal
        decimal jumlah
        int harga_satuan
        int subtotal
        int pesanan_bahan_id FK "nullable"
        int bahan_id FK
        int supplier_id FK
        int user_id FK
        datetime created_at
    }

    Transaksi_Bahan_Keluar {
        int transaksi_keluar_id PK
        date tanggal
        decimal jumlah
        enum tipe_keluar "sale|waste|damaged|expired|adjustment"
        string keterangan
        int bahan_id FK
        int pesanan_id FK "nullable"
        int user_id FK
        datetime created_at
    }

    Pembayaran {
        int pembayaran_id PK
        date tanggal
        enum metode "cash|qris|debit|transfer"
        int jumlah_bayar
        int kembalian
        int pesanan_id FK
        datetime created_at
    }

    User ||--o{ Pesanan : "membuat"
    User ||--o{ Pesanan_Bahan : "membuat"
    User ||--o{ Transaksi_Bahan_Masuk : "mencatat"
    User ||--o{ Transaksi_Bahan_Keluar : "mencatat"
    Menu ||--o{ Resep_Menu : "memiliki komposisi"
    Bahan_Baku ||--o{ Resep_Menu : "digunakan dalam"
    Pesanan ||--|{ Detail_Pesanan : "memiliki"
    Menu ||--o{ Detail_Pesanan : "termasuk"
    Pesanan ||--o| Pembayaran : "dibayar"
    Pesanan ||--o{ Transaksi_Bahan_Keluar : "mengurangi stok"
    Pesanan_Bahan ||--o| Transaksi_Bahan_Masuk : "direalisasikan"
    Bahan_Baku ||--o{ Pesanan_Bahan : "dipesan"
    Bahan_Baku ||--o{ Transaksi_Bahan_Masuk : "masuk"
    Bahan_Baku ||--o{ Transaksi_Bahan_Keluar : "keluar"
    Supplier ||--o{ Pesanan_Bahan : "menerima"
    Supplier ||--o{ Transaksi_Bahan_Masuk : "memasok"
