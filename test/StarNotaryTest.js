const StarNotary = artifacts.require('StarNotary');

contract('StarNotary', accounts => {

    beforeEach(async () => {
        this.contract = await StarNotary.new({from: accounts[0]});
    });

    describe('Can create a star', () => {
        it('Can create a star and get its name', async () => {
            const tokenId = 1;
            await this.contract.createStar('Awesome Star!', tokenId, {from: accounts[0]});

            assert.equal(await this.contract.tokenIdToStarInfo(tokenId), 'Awesome Star!');
        });
    });

    describe('Buying and selling stars', () => {
        const user1 = accounts[1];
        const user2 = accounts[2];
        const starId = 1;
        const starPrice = web3.toWei(.01, "ether");

        beforeEach(async () => {
            await this.contract.createStar('awesome star', starId, {from: user1});
        });

        describe('User1 can sell a star', () => {
            it('User1 can put up their star for sale', async () => {
                await this.contract.putStarUpForSale(starId, starPrice, {from: user1});
    
                assert.equal(await this.contract.starsForSale(starId), starPrice);
            });

            it('User1 gets the fund after selling a star', async () => {
                const starPrice = web3.toWei(.05, "ether");
                await this.contract.putStarUpForSale(starId, starPrice, {from: user1});

                const balanceOfUser1BeforeTransaction = web3.eth.getBalance(user1);
                await this.contract.buyStar(starId, {from: user2, value: starPrice});
                const balanceOfUser1AfterTransaction = web3.eth.getBalance(user1);

                assert.equal(balanceOfUser1BeforeTransaction.add(starPrice).toNumber(), balanceOfUser1AfterTransaction.toNumber());
            });
        });

        describe('User2 can buy a star that was put up for sale', () => {
            beforeEach(async () => {
                await this.contract.putStarUpForSale(starId, starPrice, {from: user1});
            });

            it('User2 is the owner of the star after they buy it', async () => {
                await this.contract.buyStar(starId, {from: user2, value: starPrice});

                assert.equal(await this.contract.ownerOf(starId), user2);
            });

            it('User2 correctly has their balance changed', async () => {
                const overpaidAmount = web3.toWei(.05, "ether");
                const balanceOfUser2BeforeTransaction = web3.eth.getBalance(user2);
                await this.contract.buyStar(starId, {from: user2, value: overpaidAmount, gasPrice: 0});
                const balanceOfUser2AfterTransaction = web3.eth.getBalance(user2);

                assert.equal(balanceOfUser2BeforeTransaction.sub(balanceOfUser2AfterTransaction).toNumber(), starPrice);
            });
        });
    });
});