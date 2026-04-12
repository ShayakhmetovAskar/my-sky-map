"""Human-readable guest identifiers in astro theme.

Generates names like `bright-nebula-a7f2` that guests can easily
read or dictate to support. Cryptographically random via `secrets`.

Collision space: len(ADJECTIVES) * len(NOUNS) * 65536
With current lists: ~40 * 40 * 65536 ≈ 100M combinations.
Birthday-bound 50% collision at ~10K concurrent guests — acceptable
for MVP. Support can disambiguate by creation timestamp if needed.
"""

import secrets

ADJECTIVES = (
    "bright", "dark", "cosmic", "stellar", "lunar", "solar",
    "nebular", "radiant", "crimson", "azure", "silver", "golden",
    "distant", "swift", "ancient", "binary", "eclipsed", "burning",
    "frozen", "drifting", "spinning", "brilliant", "twilight", "dawn",
    "wandering", "silent", "stormy", "celestial", "orbiting", "faint",
    "glowing", "spectral", "fleeting", "eternal", "hidden", "veiled",
    "scattered", "luminous", "prismatic", "astral",
)

NOUNS = (
    "nebula", "quasar", "pulsar", "comet", "asteroid", "meteor",
    "galaxy", "star", "planet", "moon", "supernova", "eclipse",
    "orbit", "photon", "nova", "crater", "horizon", "cluster",
    "aurora", "meridian", "zenith", "cosmos", "satellite", "corona",
    "helix", "ring", "disk", "void", "dust", "jet",
    "halo", "belt", "ridge", "arc", "wave", "glare",
    "shard", "beacon", "prism", "spire",
)


def generate_guest_name() -> str:
    """Return a new random guest name like `bright-nebula-a7f2`.

    The 4-char hex suffix provides 65,536 variants per adj/noun pair
    to keep collisions rare even with repeated (adjective, noun) draws.
    """
    adjective = secrets.choice(ADJECTIVES)
    noun = secrets.choice(NOUNS)
    suffix = secrets.token_hex(2)  # 4 hex chars
    return f"{adjective}-{noun}-{suffix}"
